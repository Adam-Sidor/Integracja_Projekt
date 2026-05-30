package com.example.backend.controller;

import com.example.backend.dto.InterestRateDTO;
import com.example.backend.service.InterestRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rates")
public class InterestRateController {

    private final InterestRateService service;

    public InterestRateController(InterestRateService service) {
        this.service = service;
    }

    @GetMapping
    public List<InterestRateDTO> getAll() {
        return service.getAll().stream().map(InterestRateDTO::from).toList();
    }

    @GetMapping("/{rateId}")
    public ResponseEntity<?> getByRateId(@PathVariable String rateId) {
        List<InterestRateDTO> rates = service.getByRateId(rateId)
                .stream().map(InterestRateDTO::from).toList();
        if (rates.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(rates);
    }

    @GetMapping("/types")
    public ResponseEntity<?> getTypes() {
        return ResponseEntity.ok(Map.of("types", List.of(
                Map.of("id", "ref", "name", "Stopa referencyjna"),
                Map.of("id", "lom", "name", "Stopa lombardowa"),
                Map.of("id", "dep", "name", "Stopa depozytowa"),
                Map.of("id", "red", "name", "Stopa redyskontowa weksli"),
                Map.of("id", "dys", "name", "Stopa dyskontowa weksli")
        )));
    }
}