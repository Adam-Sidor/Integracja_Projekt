package com.example.backend.controller;

import com.example.backend.model.*;
import com.example.backend.repository.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

@RestController
@RequestMapping("/api/export")
public class ExportImportController {

    private final ApartmentPriceRepository priceRepo;
    private final InterestRateRepository rateRepo;
    private final RegionRepository regionRepo;
    private final PropertyTypeRepository propertyTypeRepo;

    public ExportImportController(ApartmentPriceRepository priceRepo,
                                  InterestRateRepository rateRepo,
                                  RegionRepository regionRepo,
                                  PropertyTypeRepository propertyTypeRepo) {
        this.priceRepo = priceRepo;
        this.rateRepo = rateRepo;
        this.regionRepo = regionRepo;
        this.propertyTypeRepo = propertyTypeRepo;
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
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().parse(file.getInputStream());
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
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder().parse(file.getInputStream());
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