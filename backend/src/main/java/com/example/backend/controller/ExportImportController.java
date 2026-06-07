package com.example.backend.controller;

import com.example.backend.dto.DatabaseDumpDTO;
import com.example.backend.dto.DatabaseDumpDTO.*;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.*;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.*;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
public class ExportImportController {

    private final ApartmentPriceRepository priceRepo;
    private final InterestRateRepository rateRepo;
    private final RegionRepository regionRepo;
    private final PropertyTypeRepository propertyTypeRepo;
    private final ObjectMapper objectMapper;

    public ExportImportController(ApartmentPriceRepository priceRepo,
                                  InterestRateRepository rateRepo,
                                  RegionRepository regionRepo,
                                  PropertyTypeRepository propertyTypeRepo) {
        this.priceRepo = priceRepo;
        this.rateRepo = rateRepo;
        this.regionRepo = regionRepo;
        this.propertyTypeRepo = propertyTypeRepo;
        this.objectMapper = new ObjectMapper()
                .enable(SerializationFeature.INDENT_OUTPUT)
                .setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    // ── EKSPORT XML ──────────────────────────────────────────────────────────

    @GetMapping("/xml/rates")
    public ResponseEntity<byte[]> exportRatesXml() throws Exception {
        List<InterestRate> rates = rateRepo.findAll();
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().newDocument();
        Element root = doc.createElement("interestRates");
        doc.appendChild(root);
        for (InterestRate r : rates) {
            Element el = doc.createElement("rate");
            addChild(doc, el, "id",        String.valueOf(r.getId()));
            addChild(doc, el, "rateId",    r.getRateId());
            addChild(doc, el, "rateName",  r.getRateName());
            addChild(doc, el, "value",     r.getValue().toPlainString());
            addChild(doc, el, "validFrom", r.getValidFrom().toString());
            addChild(doc, el, "validTo",   r.getValidTo() != null ? r.getValidTo().toString() : "");
            root.appendChild(el);
        }
        return xmlResponse(toBytes(doc), "interest_rates.xml");
    }

    @GetMapping("/xml/prices")
    public ResponseEntity<byte[]> exportPricesXml() throws Exception {
        List<ApartmentPrice> prices = priceRepo.findAll();
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().newDocument();
        Element root = doc.createElement("apartmentPrices");
        doc.appendChild(root);
        for (ApartmentPrice p : prices) {
            Element el = doc.createElement("price");
            addChild(doc, el, "id",          String.valueOf(p.getId()));
            addChild(doc, el, "city",        p.getRegion().getCity());
            addChild(doc, el, "voivodeship", p.getRegion().getVoivodeship());
            addChild(doc, el, "marketType",  p.getPropertyType().getMarketType().name());
            addChild(doc, el, "priceType",   p.getPropertyType().getPriceType().name());
            addChild(doc, el, "pricePerSqm", p.getPricePerSqm().toPlainString());
            addChild(doc, el, "year",        String.valueOf(p.getYear()));
            addChild(doc, el, "quarter",     String.valueOf(p.getQuarter()));
            root.appendChild(el);
        }
        return xmlResponse(toBytes(doc), "apartment_prices.xml");
    }

    // ── IMPORT XML ───────────────────────────────────────────────────────────

    @PostMapping("/xml/rates/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> importRatesXml(@RequestParam("file") MultipartFile file) throws Exception {
        byte[] bytes = file.getBytes();
        if (bytes.length == 0) return ResponseEntity.badRequest().body(Map.of("error", "Plik jest pusty"));
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().parse(new ByteArrayInputStream(bytes));
        NodeList nodes = doc.getElementsByTagName("rate");
        int saved = 0;
        for (int i = 0; i < nodes.getLength(); i++) {
            Element el = (Element) nodes.item(i);
            String rateId = getChild(el, "rateId");
            LocalDate from = LocalDate.parse(getChild(el, "validFrom"));
            if (rateRepo.existsByRateIdAndValidFrom(rateId, from)) continue;
            InterestRate rate = new InterestRate();
            rate.setRateId(rateId);
            rate.setRateName(getChild(el, "rateName"));
            rate.setValue(new BigDecimal(getChild(el, "value")));
            rate.setValidFrom(from);
            String validTo = getChild(el, "validTo");
            rate.setValidTo(validTo.isBlank() ? null : LocalDate.parse(validTo));
            rateRepo.save(rate);
            saved++;
        }
        return ResponseEntity.ok(Map.of("imported", saved));
    }

    @PostMapping("/xml/prices/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> importPricesXml(@RequestParam("file") MultipartFile file) throws Exception {
        byte[] bytes = file.getBytes();
        if (bytes.length == 0) return ResponseEntity.badRequest().body(Map.of("error", "Plik jest pusty"));
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().parse(new ByteArrayInputStream(bytes));
        NodeList nodes = doc.getElementsByTagName("price");
        int saved = 0;
        for (int i = 0; i < nodes.getLength(); i++) {
            Element el = (Element) nodes.item(i);
            String city       = getChild(el, "city");
            String marketType = getChild(el, "marketType");
            String priceType  = getChild(el, "priceType");
            int year          = Integer.parseInt(getChild(el, "year"));
            int quarter       = Integer.parseInt(getChild(el, "quarter"));
            Optional<Region> region = regionRepo.findByCity(city);
            Optional<PropertyType> pt = propertyTypeRepo.findByMarketTypeAndPriceType(
                    PropertyType.MarketType.valueOf(marketType),
                    PropertyType.PriceType.valueOf(priceType)
            );
            if (region.isEmpty() || pt.isEmpty()) continue;
            if (priceRepo.existsByRegion_IdAndPropertyType_IdAndYearAndQuarter(
                    region.get().getId(), pt.get().getId(), year, quarter)) continue;
            ApartmentPrice ap = new ApartmentPrice();
            ap.setRegion(region.get());
            ap.setPropertyType(pt.get());
            ap.setPricePerSqm(new BigDecimal(getChild(el, "pricePerSqm")));
            ap.setYear((short) year);
            ap.setQuarter((byte) quarter);
            ap.setFetchedAt(LocalDateTime.now());
            priceRepo.save(ap);
            saved++;
        }
        return ResponseEntity.ok(Map.of("imported", saved));
    }

    // ── EKSPORT BAZY DANYCH (JSON) ────────────────────────────────────────────

    @GetMapping("/db")
    @Transactional(readOnly = true, isolation = Isolation.SERIALIZABLE)
    public ResponseEntity<byte[]> exportDatabase() throws Exception {
        DatabaseDumpDTO dump = new DatabaseDumpDTO();

        // Eksport regionów
        dump.regions = regionRepo.findAll().stream()
                .map(r -> {
                    RegionRecord rec = new RegionRecord();
                    rec.id = r.getId();
                    rec.city = r.getCity();
                    rec.voivodeship = r.getVoivodeship();
                    return rec;
                })
                .collect(Collectors.toList());

        // Eksport typów nieruchomości
        dump.propertyTypes = propertyTypeRepo.findAll().stream()
                .map(pt -> {
                    PropertyTypeRecord rec = new PropertyTypeRecord();
                    rec.id = pt.getId();
                    rec.marketType = pt.getMarketType().name();
                    rec.priceType = pt.getPriceType().name();
                    return rec;
                })
                .collect(Collectors.toList());

        // Eksport stóp procentowych
        dump.interestRates = rateRepo.findAll().stream()
                .map(r -> {
                    InterestRateRecord rec = new InterestRateRecord();
                    rec.id = r.getId();
                    rec.rateId = r.getRateId();
                    rec.rateName = r.getRateName();
                    rec.value = r.getValue().toPlainString();
                    rec.validFrom = r.getValidFrom().toString();
                    rec.validTo = r.getValidTo() != null ? r.getValidTo().toString() : null;
                    return rec;
                })
                .collect(Collectors.toList());

        // Eksport cen mieszkań
        dump.apartmentPrices = priceRepo.findAll().stream()
                .map(p -> {
                    ApartmentPriceRecord rec = new ApartmentPriceRecord();
                    rec.id = p.getId();
                    rec.regionId = p.getRegion().getId();
                    rec.propertyTypeId = p.getPropertyType().getId();
                    rec.pricePerSqm = p.getPricePerSqm().toPlainString();
                    rec.year = p.getYear();
                    rec.quarter = p.getQuarter();
                    rec.fetchedAt = p.getFetchedAt() != null ? p.getFetchedAt().toString() : null;
                    return rec;
                })
                .collect(Collectors.toList());

        dump.exportedAt = LocalDateTime.now().toString();
        dump.version = "1.0";

        byte[] json = objectMapper.writeValueAsBytes(dump);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=database_export.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(json);
    }

    @PostMapping("/db/import")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public ResponseEntity<?> importDatabase(@RequestParam("file") MultipartFile file) throws Exception {
        byte[] bytes = file.getBytes();
        if (bytes.length == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plik jest pusty"));
        }
        DatabaseDumpDTO dump = objectMapper.readValue(bytes, DatabaseDumpDTO.class);

        Map<Long, Long> regionIdMap = new HashMap<>();
        Map<Long, Long> propertyTypeIdMap = new HashMap<>();
        int regionsImported = 0, typesImported = 0, ratesImported = 0, pricesImported = 0;

        // Import regionów
        if (dump.regions != null) {
            for (RegionRecord rec : dump.regions) {
                Optional<Region> existing = regionRepo.findByCity(rec.city);
                if (existing.isPresent()) {
                    regionIdMap.put(rec.id, existing.get().getId());
                } else {
                    Region r = new Region();
                    r.setCity(rec.city);
                    r.setVoivodeship(rec.voivodeship);
                    Region saved = regionRepo.save(r);
                    regionIdMap.put(rec.id, saved.getId());
                    regionsImported++;
                }
            }
        }

        // Import typów nieruchomości
        if (dump.propertyTypes != null) {
            for (PropertyTypeRecord rec : dump.propertyTypes) {
                PropertyType.MarketType mt = PropertyType.MarketType.valueOf(rec.marketType);
                PropertyType.PriceType pt = PropertyType.PriceType.valueOf(rec.priceType);
                Optional<PropertyType> existing = propertyTypeRepo.findByMarketTypeAndPriceType(mt, pt);
                if (existing.isPresent()) {
                    propertyTypeIdMap.put(rec.id, existing.get().getId());
                } else {
                    PropertyType type = new PropertyType();
                    type.setMarketType(mt);
                    type.setPriceType(pt);
                    PropertyType saved = propertyTypeRepo.save(type);
                    propertyTypeIdMap.put(rec.id, saved.getId());
                    typesImported++;
                }
            }
        }

        // Import stóp procentowych
        if (dump.interestRates != null) {
            for (InterestRateRecord rec : dump.interestRates) {
                LocalDate from = LocalDate.parse(rec.validFrom);
                if (rateRepo.existsByRateIdAndValidFrom(rec.rateId, from)) continue;
                InterestRate rate = new InterestRate();
                rate.setRateId(rec.rateId);
                rate.setRateName(rec.rateName);
                rate.setValue(new BigDecimal(rec.value));
                rate.setValidFrom(from);
                rate.setValidTo(rec.validTo != null && !rec.validTo.isBlank()
                        ? LocalDate.parse(rec.validTo) : null);
                rateRepo.save(rate);
                ratesImported++;
            }
        }

        // Import cen mieszkań
        if (dump.apartmentPrices != null) {
            for (ApartmentPriceRecord rec : dump.apartmentPrices) {
                Long mappedRegionId = regionIdMap.get(rec.regionId);
                Long mappedTypeId = propertyTypeIdMap.get(rec.propertyTypeId);
                if (mappedRegionId == null || mappedTypeId == null) continue;

                if (priceRepo.existsByRegion_IdAndPropertyType_IdAndYearAndQuarter(
                        mappedRegionId, mappedTypeId, rec.year, rec.quarter)) continue;

                Optional<Region> region = regionRepo.findById(mappedRegionId);
                Optional<PropertyType> propType = propertyTypeRepo.findById(mappedTypeId);
                if (region.isEmpty() || propType.isEmpty()) continue;

                ApartmentPrice ap = new ApartmentPrice();
                ap.setRegion(region.get());
                ap.setPropertyType(propType.get());
                ap.setPricePerSqm(new BigDecimal(rec.pricePerSqm));
                ap.setYear(rec.year);
                ap.setQuarter(rec.quarter);
                ap.setFetchedAt(LocalDateTime.now());
                priceRepo.save(ap);
                pricesImported++;
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Import zakończony pomyślnie",
                "imported", Map.of(
                        "regions", regionsImported,
                        "propertyTypes", typesImported,
                        "interestRates", ratesImported,
                        "apartmentPrices", pricesImported
                )
        ));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void addChild(Document doc, Element parent, String tag, String value) {
        Element child = doc.createElement(tag);
        child.setTextContent(value != null ? value : "");
        parent.appendChild(child);
    }

    private String getChild(Element parent, String tag) {
        NodeList nl = parent.getElementsByTagName(tag);
        if (nl.getLength() == 0) return "";
        return nl.item(0).getTextContent().trim();
    }

    private byte[] toBytes(Document doc) throws Exception {
        Transformer t = TransformerFactory.newInstance().newTransformer();
        t.setOutputProperty(OutputKeys.INDENT, "yes");
        t.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        t.transform(new DOMSource(doc), new StreamResult(out));
        return out.toByteArray();
    }

    private ResponseEntity<byte[]> xmlResponse(byte[] data, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_XML)
                .body(data);
    }
}