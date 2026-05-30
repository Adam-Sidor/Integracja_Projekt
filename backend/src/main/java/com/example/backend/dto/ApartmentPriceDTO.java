package com.example.backend.dto;

import com.example.backend.model.ApartmentPrice;

public record ApartmentPriceDTO(
        Long id,
        String city,
        String voivodeship,
        String marketType,
        String priceType,
        double pricePerSqm,
        int year,
        int quarter
) {
    public static ApartmentPriceDTO from(ApartmentPrice ap) {
        return new ApartmentPriceDTO(
                ap.getId(),
                ap.getRegion().getCity(),
                ap.getRegion().getVoivodeship(),
                ap.getPropertyType().getMarketType().name(),
                ap.getPropertyType().getPriceType().name(),
                ap.getPricePerSqm().doubleValue(),
                ap.getYear(),
                ap.getQuarter()
        );
    }
}