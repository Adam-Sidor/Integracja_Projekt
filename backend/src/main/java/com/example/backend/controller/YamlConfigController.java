package com.example.backend.controller;

import com.example.backend.config.AppConfig;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@PreAuthorize("hasRole('ADMIN')")
public class YamlConfigController {

    private final AppConfig appConfig;

    public YamlConfigController(AppConfig appConfig) {
        this.appConfig = appConfig;
    }

    // Pobierz aktualną konfigurację
    @GetMapping
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(Map.of(
                "yearsBack",  appConfig.getYearsBack(),
                "ratesUrl",   appConfig.getRatesUrl(),
                "pricesUrl",  appConfig.getPricesUrl()
        ));
    }

    // Eksport konfiguracji jako YAML
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportYaml() {
        String yaml = String.format("""
                app:
                  yearsBack: %d
                  ratesUrl: %s
                  pricesUrl: %s
                """,
                appConfig.getYearsBack(),
                appConfig.getRatesUrl(),
                appConfig.getPricesUrl()
        );
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=config.yaml")
                .contentType(MediaType.parseMediaType("application/x-yaml"))
                .body(yaml.getBytes());
    }

    // Import konfiguracji z YAML — nadpisuje aktywne ustawienia w pamięci
    @PostMapping("/import")
    public ResponseEntity<?> importYaml(@RequestParam("file") MultipartFile file) throws Exception {
        Map<String, String> parsed = new LinkedHashMap<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isBlank() || line.startsWith("#") || !line.contains(":")) continue;
                String[] parts = line.split(":", 2);
                String key = parts[0].trim();
                String val = parts[1].trim();
                if (!val.isBlank()) parsed.put(key, val);
            }
        }

        // Zastosuj wczytane wartości
        if (parsed.containsKey("yearsBack")) {
            appConfig.setYearsBack(Integer.parseInt(parsed.get("yearsBack")));
        }
        if (parsed.containsKey("ratesUrl")) {
            appConfig.setRatesUrl(parsed.get("ratesUrl"));
        }
        if (parsed.containsKey("pricesUrl")) {
            appConfig.setPricesUrl(parsed.get("pricesUrl"));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Konfiguracja zaktualizowana",
                "current", Map.of(
                        "yearsBack", appConfig.getYearsBack(),
                        "ratesUrl",  appConfig.getRatesUrl(),
                        "pricesUrl", appConfig.getPricesUrl()
                )
        ));
    }
}