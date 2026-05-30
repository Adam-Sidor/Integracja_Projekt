package com.example.backend.controller;

import com.example.backend.repository.*;
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

    public AdminController(ApartmentPriceRepository priceRepo,
                           InterestRateRepository rateRepo,
                           UserRepository userRepo) {
        this.priceRepo = priceRepo;
        this.rateRepo = rateRepo;
        this.userRepo = userRepo;
    }

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

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(Map.of(
                "prices", priceRepo.count(),
                "rates",  rateRepo.count(),
                "users",  userRepo.count()
        ));
    }
}