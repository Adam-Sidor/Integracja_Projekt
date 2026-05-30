package com.example.backend.service;

import com.example.backend.config.NbpProperties;
import com.example.backend.model.ApartmentPrice;
import com.example.backend.model.PropertyType;
import com.example.backend.model.Region;
import com.example.backend.repository.ApartmentPriceRepository;
import com.example.backend.repository.PropertyTypeRepository;
import com.example.backend.repository.RegionRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.*;

@Service
public class ApartmentPriceService {

    private static final Logger log = LoggerFactory.getLogger(ApartmentPriceService.class);

    private static final Map<String, Integer> ROMAN = Map.of(
            "I", 1, "II", 2, "III", 3, "IV", 4
    );

    // Nazwy sekcji w pliku → priceType (tylko ofertowa jest w tym pliku)
    private static final Map<String, String> PRICE_TYPE_MAP = new LinkedHashMap<>();
    static {
        PRICE_TYPE_MAP.put("Ceny ofertowe",     "ofertowa");
        PRICE_TYPE_MAP.put("Offer prices",       "ofertowa");
        PRICE_TYPE_MAP.put("Ceny transakcyjne",  "transakcyjna");
        PRICE_TYPE_MAP.put("Transaction prices", "transakcyjna");
        PRICE_TYPE_MAP.put("Ceny hedoniczne",    "hedoniczna");
        PRICE_TYPE_MAP.put("Hedonic prices",     "hedoniczna");
    }

    private static final Map<String, String> SHEET_MARKET = new LinkedHashMap<>();
    static {
        SHEET_MARKET.put("Rynek pierwotny", "pierwotny");
        SHEET_MARKET.put("Rynek wtórny",    "wtórny");
    }

    private final ApartmentPriceRepository priceRepo;
    private final RegionRepository regionRepo;
    private final PropertyTypeRepository propertyTypeRepo;
    private final NbpProperties props;

    public ApartmentPriceService(ApartmentPriceRepository priceRepo,
                                 RegionRepository regionRepo,
                                 PropertyTypeRepository propertyTypeRepo,
                                 NbpProperties props) {
        this.priceRepo = priceRepo;
        this.regionRepo = regionRepo;
        this.propertyTypeRepo = propertyTypeRepo;
        this.props = props;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public int fetchAndStore() {
        log.info("Pobieranie cen mieszkań z NBP (XLSX)...");
        int saved = 0;
        // Bierzemy dane od początku okresu 10-letniego
        int cutoffYear = LocalDate.now().minusYears(props.getYearsBack()).getYear();

        try (InputStream in = URI.create(props.getPricesUrl()).toURL().openStream();
             Workbook wb = new XSSFWorkbook(in)) {

            for (Map.Entry<String, String> sheetEntry : SHEET_MARKET.entrySet()) {
                String sheetName  = sheetEntry.getKey();
                String marketType = sheetEntry.getValue();

                Sheet sheet = wb.getSheet(sheetName);
                if (sheet == null) {
                    log.warn("Brak arkusza: {}", sheetName);
                    continue;
                }

                String currentPriceType = null;
                List<String> cityNames  = new ArrayList<>();
                int lastRow = sheet.getLastRowNum();

                for (int r = 0; r <= lastRow; r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) continue;

                    String c0 = getCellString(row.getCell(0));
                    String c1 = getCellString(row.getCell(1));

                    // Wykryj sekcję po col1
                    if (PRICE_TYPE_MAP.containsKey(c1)) {
                        currentPriceType = PRICE_TYPE_MAP.get(c1);
                        cityNames.clear();
                        log.debug("Nowa sekcja: {} (wiersz {})", currentPriceType, r);
                        continue;
                    }

                    // Wiersz nagłówkowy miast
                    if ("Kwartał".equals(c0)) {
                        cityNames.clear();
                        for (int c = 1; c < row.getLastCellNum(); c++) {
                            String city = getCellString(row.getCell(c))
                                    .replace("*", "").trim();
                            cityNames.add(city);
                        }
                        log.debug("Znaleziono {} miast w arkuszu {}", cityNames.size(), sheetName);
                        continue;
                    }

                    // Wiersz danych — format "I 2016"
                    if (currentPriceType == null || cityNames.isEmpty()) continue;
                    int[] yq = parseYearQuarter(c0);
                    if (yq == null || yq[0] < cutoffYear) continue;

                    int year = yq[0], quarter = yq[1];

                    Optional<PropertyType> ptOpt = propertyTypeRepo.findByMarketTypeAndPriceType(
                            PropertyType.MarketType.valueOf(marketType),
                            PropertyType.PriceType.valueOf(currentPriceType)
                    );
                    if (ptOpt.isEmpty()) {
                        log.warn("Brak PropertyType: {} / {}", marketType, currentPriceType);
                        continue;
                    }
                    PropertyType propertyType = ptOpt.get();

                    for (int c = 0; c < cityNames.size(); c++) {
                        String cityName = cityNames.get(c);
                        if (cityName.isBlank()) continue;

                        Optional<Region> regionOpt = regionRepo.findByCity(cityName);
                        if (regionOpt.isEmpty()) {
                            log.debug("Nieznane miasto: '{}'", cityName);
                            continue;
                        }
                        Region region = regionOpt.get();

                        Cell cell = row.getCell(c + 1);
                        BigDecimal price = getCellDecimal(cell);
                        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) continue;

                        if (priceRepo.existsByRegion_IdAndPropertyType_IdAndYearAndQuarter(
                                region.getId(), propertyType.getId(), year, quarter)) continue;

                        ApartmentPrice ap = new ApartmentPrice();
                        ap.setRegion(region);
                        ap.setPropertyType(propertyType);
                        ap.setPricePerSqm(price);
                        ap.setYear((short) year);
                        ap.setQuarter((byte) quarter);
                        priceRepo.save(ap);
                        saved++;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Błąd pobierania cen mieszkań: {}", e.getMessage(), e);
        }

        log.info("Zapisano {} wpisów cen mieszkań", saved);
        return saved;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, readOnly = true)
    public List<ApartmentPrice> getAll() {
        int fromYear = LocalDate.now().minusYears(props.getYearsBack()).getYear();
        return priceRepo.findByYearRange(fromYear, LocalDate.now().getYear());
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, readOnly = true)
    public List<ApartmentPrice> getByCity(String city) {
        return priceRepo.findByRegion_CityOrderByYearAscQuarterAsc(city);
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BLANK   -> "";
            default      -> "";
        };
    }

    private BigDecimal getCellDecimal(Cell cell) {
        if (cell == null) return null;
        try {
            return switch (cell.getCellType()) {
                case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
                case STRING  -> new BigDecimal(
                        cell.getStringCellValue().replace(",", ".").trim());
                default -> null;
            };
        } catch (Exception e) {
            return null;
        }
    }

    private int[] parseYearQuarter(String value) {
        if (value == null || value.isBlank()) return null;
        String[] parts = value.trim().split("\\s+");
        if (parts.length != 2) return null;
        Integer quarter = ROMAN.get(parts[0]);
        if (quarter == null) return null;
        try {
            int year = Integer.parseInt(parts[1]);
            return new int[]{year, quarter};
        } catch (NumberFormatException e) {
            return null;
        }
    }
}