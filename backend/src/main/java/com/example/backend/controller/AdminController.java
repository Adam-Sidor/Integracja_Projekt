package com.example.backend.controller;

import com.example.backend.repository.*;
import com.example.backend.service.ApartmentPriceService;
import com.example.backend.service.InterestRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ApartmentPriceRepository priceRepo;
    private final InterestRateRepository rateRepo;
    private final UserRepository userRepo;
    private final InterestRateService interestRateService;
    private final ApartmentPriceService apartmentPriceService;

    public AdminController(ApartmentPriceRepository priceRepo,
                           InterestRateRepository rateRepo,
                           UserRepository userRepo,
                           InterestRateService interestRateService,
                           ApartmentPriceService apartmentPriceService) {
        this.priceRepo = priceRepo;
        this.rateRepo = rateRepo;
        this.userRepo = userRepo;
        this.interestRateService = interestRateService;
        this.apartmentPriceService = apartmentPriceService;
    }

    // ── Statystyki ───────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(Map.of(
                "prices", priceRepo.count(),
                "rates",  rateRepo.count(),
                "users",  userRepo.count()
        ));
    }

    // ── Pobieranie danych z NBP ──────────────────────────────────────────────

    @PostMapping("/fetch-rates")
    public ResponseEntity<?> fetchRates() {
        int count = interestRateService.fetchAndStore();
        return ResponseEntity.ok(Map.of("message", "Pobrano stopy procentowe", "saved", count));
    }

    @PostMapping("/fetch-prices")
    public ResponseEntity<?> fetchPrices() {
        int count = apartmentPriceService.fetchAndStore();
        return ResponseEntity.ok(Map.of("message", "Pobrano ceny mieszkań", "saved", count));
    }

    @PostMapping("/fetch-all")
    public ResponseEntity<?> fetchAll() {
        int rates  = interestRateService.fetchAndStore();
        int prices = apartmentPriceService.fetchAndStore();
        return ResponseEntity.ok(Map.of(
                "message",     "Pobrano wszystkie dane z NBP",
                "savedRates",  rates,
                "savedPrices", prices
        ));
    }

    // ── Czyszczenie bazy ─────────────────────────────────────────────────────

    @DeleteMapping("/clear/prices")
    public ResponseEntity<?> clearPrices() {
        long count = priceRepo.count();
        priceRepo.deleteAll();
        return ResponseEntity.ok(Map.of("message", "Usunięto ceny mieszkań", "deleted", count));
    }

    @DeleteMapping("/clear/rates")
    public ResponseEntity<?> clearRates() {
        long count = rateRepo.count();
        rateRepo.deleteAll();
        return ResponseEntity.ok(Map.of("message", "Usunięto stopy procentowe", "deleted", count));
    }

    @DeleteMapping("/clear/all")
    public ResponseEntity<?> clearAll() {
        long prices = priceRepo.count();
        long rates  = rateRepo.count();
        priceRepo.deleteAll();
        rateRepo.deleteAll();
        return ResponseEntity.ok(Map.of(
                "message",       "Wyczyszczono bazę danych",
                "deletedPrices", prices,
                "deletedRates",  rates
        ));
    }
}