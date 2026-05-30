package com.example.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.nbp")
public class NbpProperties {

    private String ratesUrl;
    private String pricesUrl;
    private int yearsBack;

    public String getRatesUrl() { return ratesUrl; }
    public void setRatesUrl(String ratesUrl) { this.ratesUrl = ratesUrl; }

    public String getPricesUrl() { return pricesUrl; }
    public void setPricesUrl(String pricesUrl) { this.pricesUrl = pricesUrl; }

    public int getYearsBack() { return yearsBack; }
    public void setYearsBack(int yearsBack) { this.yearsBack = yearsBack; }
}