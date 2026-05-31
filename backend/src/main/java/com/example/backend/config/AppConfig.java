package com.example.backend.config;

import org.springframework.stereotype.Component;

/**
 * Konfigurowalna część ustawień aplikacji — można nadpisać przez import YAML.
 * Przechowuje aktualnie aktywne ustawienia w pamięci.
 */
@Component
public class AppConfig {

    private int yearsBack = 10;
    private String ratesUrl = "https://static.nbp.pl/dane/stopy/stopy_procentowe_archiwum.xml";
    private String pricesUrl = "https://static.nbp.pl/dane/rynek-nieruchomosci/ceny_mieszkan.xlsx";

    public int getYearsBack() { return yearsBack; }
    public void setYearsBack(int yearsBack) { this.yearsBack = yearsBack; }

    public String getRatesUrl() { return ratesUrl; }
    public void setRatesUrl(String ratesUrl) { this.ratesUrl = ratesUrl; }

    public String getPricesUrl() { return pricesUrl; }
    public void setPricesUrl(String pricesUrl) { this.pricesUrl = pricesUrl; }
}