package com.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppConfig {

    @Value("${app.nbp.years-back:10}")
    private int yearsBack;

    @Value("${app.nbp.rates-url}")
    private String ratesUrl;

    @Value("${app.nbp.prices-url}")
    private String pricesUrl;

    public int getYearsBack() { return yearsBack; }
    public void setYearsBack(int yearsBack) { this.yearsBack = yearsBack; }

    public String getRatesUrl() { return ratesUrl; }
    public void setRatesUrl(String ratesUrl) { this.ratesUrl = ratesUrl; }

    public String getPricesUrl() { return pricesUrl; }
    public void setPricesUrl(String pricesUrl) { this.pricesUrl = pricesUrl; }
}