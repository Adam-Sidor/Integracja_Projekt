package com.example.backend.service;

import com.example.backend.config.AppConfig;
import com.example.backend.model.InterestRate;
import com.example.backend.repository.InterestRateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.*;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.*;

@Service
public class InterestRateService {

    private static final Logger log = LoggerFactory.getLogger(InterestRateService.class);

    private static final Map<String, String> RATE_NAMES = Map.of(
            "ref", "Stopa referencyjna",
            "lom", "Stopa lombardowa",
            "dep", "Stopa depozytowa",
            "red", "Stopa redyskontowa weksli",
            "dys", "Stopa dyskontowa weksli"
    );

    private final InterestRateRepository repo;
    private final AppConfig appConfig;

    public InterestRateService(InterestRateRepository repo, AppConfig appConfig) {
        this.repo = repo;
        this.appConfig = appConfig;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public int fetchAndStore() {
        log.info("Pobieranie stóp procentowych z NBP...");
        int saved = 0;
        LocalDate cutoff = LocalDate.now().minusYears(appConfig.getYearsBack());

        try (InputStream in = URI.create(appConfig.getRatesUrl()).toURL().openStream()) {
            Document doc = DocumentBuilderFactory.newInstance()
                    .newDocumentBuilder().parse(in);

            NodeList groups = doc.getElementsByTagName("pozycje");
            int total = groups.getLength();

            int startIdx = 0;
            for (int i = 0; i < total; i++) {
                Element g = (Element) groups.item(i);
                LocalDate d = LocalDate.parse(g.getAttribute("obowiazuje_od"));
                if (d.isBefore(cutoff)) startIdx = i;
                else break;
            }

            log.info("Cutoff: {}, startIdx: {}", cutoff, startIdx);

            for (int i = startIdx; i < total; i++) {
                Element group = (Element) groups.item(i);
                LocalDate validFrom = LocalDate.parse(group.getAttribute("obowiazuje_od"));

                LocalDate validTo = null;
                if (i + 1 < total) {
                    Element next = (Element) groups.item(i + 1);
                    validTo = LocalDate.parse(next.getAttribute("obowiazuje_od")).minusDays(1);
                }

                NodeList positions = group.getElementsByTagName("pozycja");
                for (int j = 0; j < positions.getLength(); j++) {
                    Element pos = (Element) positions.item(j);
                    String rateId = pos.getAttribute("id");
                    if (!RATE_NAMES.containsKey(rateId)) continue;
                    if (repo.existsByRateIdAndValidFrom(rateId, validFrom)) continue;

                    BigDecimal value = new BigDecimal(
                            pos.getAttribute("oprocentowanie").replace(",", "."));

                    InterestRate rate = new InterestRate();
                    rate.setRateId(rateId);
                    rate.setRateName(RATE_NAMES.get(rateId));
                    rate.setValue(value);
                    rate.setValidFrom(validFrom);
                    rate.setValidTo(validTo);
                    repo.save(rate);
                    saved++;
                }
            }
        } catch (Exception e) {
            log.error("Błąd pobierania stóp procentowych: {}", e.getMessage(), e);
        }

        log.info("Zapisano {} wpisów stóp procentowych", saved);
        return saved;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, readOnly = true)
    public List<InterestRate> getAll() {
        List<InterestRate> ref = repo.findByRateIdOrderByValidFromAsc("ref");
        if (ref.isEmpty()) return repo.findAll();
        return repo.findFromDate(ref.get(0).getValidFrom());
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, readOnly = true)
    public List<InterestRate> getByRateId(String rateId) {
        return repo.findByRateIdOrderByValidFromAsc(rateId);
    }
}