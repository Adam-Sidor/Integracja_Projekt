package com.example.backend.dto;

import com.example.backend.model.InterestRate;

public record InterestRateDTO(
        Long id,
        String rateId,
        String rateName,
        double value,
        String validFrom,
        String validTo
) {
    public static InterestRateDTO from(InterestRate r) {
        return new InterestRateDTO(
                r.getId(),
                r.getRateId(),
                r.getRateName(),
                r.getValue().doubleValue(),
                r.getValidFrom().toString(),
                r.getValidTo() != null ? r.getValidTo().toString() : null
        );
    }
}