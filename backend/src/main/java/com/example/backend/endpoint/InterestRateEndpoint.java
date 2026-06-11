package com.example.backend.endpoint;

import com.example.backend.model.InterestRate;
import com.example.backend.service.InterestRateService;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import java.util.List;

@Endpoint
public class InterestRateEndpoint {

    private static final String NS = "http://projekt.example.com/rates";

    private final InterestRateService service;

    public InterestRateEndpoint(InterestRateService service) {
        this.service = service;
    }

    @PayloadRoot(namespace = NS, localPart = "GetInterestRatesRequest")
    @ResponsePayload
    public GetInterestRatesResponse getRates(@RequestPayload GetInterestRatesRequest request) {
        List<InterestRate> rates;

        if (request.getRateId() != null && !request.getRateId().isBlank()) {
            rates = service.getByRateId(request.getRateId());
        } else {
            rates = service.getAll();
        }

        GetInterestRatesResponse response = new GetInterestRatesResponse();
        rates.forEach(r -> {
            RateEntry entry = new RateEntry();
            entry.setId(r.getId());
            entry.setRateId(r.getRateId());
            entry.setRateName(r.getRateName());
            entry.setValue(r.getValue().doubleValue());
            entry.setValidFrom(r.getValidFrom().toString());
            entry.setValidTo(r.getValidTo() != null ? r.getValidTo().toString() : null);
            response.getRates().add(entry);
        });

        return response;
    }

    // ── JAXB DTOs ────────────────────────────────────────────────────────────

    @XmlRootElement(name = "GetInterestRatesRequest", namespace = NS)
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class GetInterestRatesRequest {
        @XmlElement(namespace = NS)
        private String rateId;
        public String getRateId() { return rateId; }
        public void setRateId(String rateId) { this.rateId = rateId; }
    }

    @XmlRootElement(name = "GetInterestRatesResponse", namespace = NS)
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class GetInterestRatesResponse {
        @XmlElement(name = "rates", namespace = NS)
        private List<RateEntry> rates = new java.util.ArrayList<>();
        public List<RateEntry> getRates() { return rates; }
    }

    @XmlAccessorType(XmlAccessType.FIELD)
    public static class RateEntry {
        private Long id;
        private String rateId;
        private String rateName;
        private double value;
        private String validFrom;
        private String validTo;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getRateId() { return rateId; }
        public void setRateId(String rateId) { this.rateId = rateId; }
        public String getRateName() { return rateName; }
        public void setRateName(String rateName) { this.rateName = rateName; }
        public double getValue() { return value; }
        public void setValue(double value) { this.value = value; }
        public String getValidFrom() { return validFrom; }
        public void setValidFrom(String validFrom) { this.validFrom = validFrom; }
        public String getValidTo() { return validTo; }
        public void setValidTo(String validTo) { this.validTo = validTo; }
    }
}