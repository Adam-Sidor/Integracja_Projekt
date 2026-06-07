package com.example.backend.dto;

import java.util.List;

public class DatabaseDumpDTO {

    public String version;
    public String exportedAt;
    public List<RegionRecord> regions;
    public List<PropertyTypeRecord> propertyTypes;
    public List<InterestRateRecord> interestRates;
    public List<ApartmentPriceRecord> apartmentPrices;

    public static class RegionRecord {
        public Long id;
        public String city;
        public String voivodeship;
    }

    public static class PropertyTypeRecord {
        public Long id;
        public String marketType;
        public String priceType;
    }

    public static class InterestRateRecord {
        public Long id;
        public String rateId;
        public String rateName;
        public String value;
        public String validFrom;
        public String validTo;
    }

    public static class ApartmentPriceRecord {
        public Long id;
        public Long regionId;
        public Long propertyTypeId;
        public String pricePerSqm;
        public Short year;
        public Byte quarter;
        public String fetchedAt;
    }
}