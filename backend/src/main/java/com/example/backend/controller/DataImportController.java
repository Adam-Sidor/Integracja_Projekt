package com.example.backend.controller;

import com.example.backend.service.ApartmentPriceService;
import com.example.backend.service.InterestRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class DataImportController {

    private final InterestRateService interestRateService;
    private final ApartmentPriceService apartmentPriceService;

    public DataImportController(InterestRateService interestRateService,
                                 ApartmentPriceService apartmentPriceService) {
        this.interestRateService = interestRateService;
        this.apartmentPriceService = apartmentPriceService;
    }

    @PostMapping("/fetch-rates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> fetchRates() {
        int count = interestRateService.fetchAndStore();
        return ResponseEntity.ok(Map.of(
                "message", "Pobrano stopy procentowe",
                "saved", count
        ));
    }

    @PostMapping("/fetch-prices")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> fetchPrices() {
        int count = apartmentPriceService.fetchAndStore();
        return ResponseEntity.ok(Map.of(
                "message", "Pobrano ceny mieszkań",
                "saved", count
        ));
    }

    @PostMapping("/fetch-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> fetchAll() {
        int rates  = interestRateService.fetchAndStore();
        int prices = apartmentPriceService.fetchAndStore();
        return ResponseEntity.ok(Map.of(
                "message", "Pobrano wszystkie dane z NBP",
                "savedRates", rates,
                "savedPrices", prices
        ));
    }
}