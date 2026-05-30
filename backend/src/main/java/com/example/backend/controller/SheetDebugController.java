package com.example.backend.controller;

import com.example.backend.config.NbpProperties;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class SheetDebugController {

    private final NbpProperties props;

    public SheetDebugController(NbpProperties props) {
        this.props = props;
    }

    @GetMapping("/sheet-names")
    public ResponseEntity<?> sheetNames() {
        List<String> names = new ArrayList<>();
        try (InputStream in = URI.create(props.getPricesUrl()).toURL().openStream();
             Workbook wb = new XSSFWorkbook(in)) {
            for (int i = 0; i < wb.getNumberOfSheets(); i++) {
                names.add(i + ": " + wb.getSheetName(i));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
        return ResponseEntity.ok(Map.of("sheets", names));
    }

    // Skanuje kolumny 0 i 1 całego arkusza - szukamy wszystkich nagłówków sekcji
    @GetMapping("/sheet-sections")
    public ResponseEntity<?> sheetSections() {
        List<Map<String, Object>> result = new ArrayList<>();
        try (InputStream in = URI.create(props.getPricesUrl()).toURL().openStream();
             Workbook wb = new XSSFWorkbook(in)) {

            Sheet sheet = wb.getSheet("Rynek pierwotny");
            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String c0 = getCellString(row.getCell(0));
                String c1 = getCellString(row.getCell(1));
                // Pokaż tylko wiersze z tekstem nie będące danymi liczbowymi
                if ((!c0.isBlank() || !c1.isBlank()) && !isNumeric(c0) && !c0.matches("[IVX]+ \\d{4}")) {
                    result.add(Map.of("row", r, "c0", c0, "c1", c1));
                }
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
        return ResponseEntity.ok(result);
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

    private boolean isNumeric(String s) {
        try { Double.parseDouble(s); return true; } catch (Exception e) { return false; }
    }
}