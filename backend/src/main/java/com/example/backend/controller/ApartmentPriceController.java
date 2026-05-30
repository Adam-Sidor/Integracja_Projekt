package com.example.backend.controller;

import com.example.backend.dto.ApartmentPriceDTO;
import com.example.backend.model.PropertyType;
import com.example.backend.repository.ApartmentPriceRepository;
import com.example.backend.repository.RegionRepository;
import com.example.backend.service.ApartmentPriceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prices")
public class ApartmentPriceController {

    private final ApartmentPriceService service;
    private final RegionRepository regionRepo;
    private final ApartmentPriceRepository priceRepo;

    public ApartmentPriceController(ApartmentPriceService service,
                                    RegionRepository regionRepo,
                                    ApartmentPriceRepository priceRepo) {
        this.service = service;
        this.regionRepo = regionRepo;
        this.priceRepo = priceRepo;
    }

    @GetMapping
    public List<ApartmentPriceDTO> getAll() {
        return service.getAll().stream().map(ApartmentPriceDTO::from).toList();
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<?> getByCity(@PathVariable String city) {
        List<ApartmentPriceDTO> prices = service.getByCity(city)
                .stream().map(ApartmentPriceDTO::from).toList();
        if (prices.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(prices);
    }

    @GetMapping("/city/{city}/market/{marketType}")
    public ResponseEntity<?> getByCityAndMarket(
            @PathVariable String city,
            @PathVariable String marketType,
            @RequestParam(defaultValue = "2016") int fromYear) {
        try {
            PropertyType.MarketType mt = PropertyType.MarketType.valueOf(marketType);
            List<ApartmentPriceDTO> prices = priceRepo
                    .findByCityAndMarketType(city, mt, fromYear)
                    .stream().map(ApartmentPriceDTO::from).toList();
            if (prices.isEmpty()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(prices);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Nieprawidłowy typ rynku: " + marketType);
        }
    }

    @GetMapping("/quarter")
    public List<ApartmentPriceDTO> getByQuarter(
            @RequestParam int year,
            @RequestParam int quarter) {
        return priceRepo.findByYearAndQuarterOrderByRegion_CityAsc(year, quarter)
                .stream().map(ApartmentPriceDTO::from).toList();
    }

    @GetMapping("/regions")
    public ResponseEntity<?> getRegions() {
        return ResponseEntity.ok(regionRepo.findAll().stream()
                .map(r -> new java.util.LinkedHashMap<String, Object>() {{
                    put("id", r.getId());
                    put("city", r.getCity());
                    put("voivodeship", r.getVoivodeship());
                }})
                .toList());
    }
}