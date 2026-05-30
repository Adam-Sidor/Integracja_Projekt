package com.example.backend.service;

import com.example.backend.config.NbpProperties;
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
    private final NbpProperties props;

    public InterestRateService(InterestRateRepository repo, NbpProperties props) {
        this.repo = repo;
        this.props = props;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public int fetchAndStore() {
        log.info("Pobieranie stóp procentowych z NBP...");
        int saved = 0;
        LocalDate cutoff = LocalDate.now().minusYears(props.getYearsBack());

        try (InputStream in = URI.create(props.getRatesUrl()).toURL().openStream()) {
            Document doc = DocumentBuilderFactory.newInstance()
                    .newDocumentBuilder().parse(in);

            NodeList groups = doc.getElementsByTagName("pozycje");
            int total = groups.getLength();

            // Znajdź ostatnią grupę PRZED cutoffem — ona obowiązywała na początku okresu
            int startIdx = 0;
            for (int i = 0; i < total; i++) {
                Element g = (Element) groups.item(i);
                LocalDate d = LocalDate.parse(g.getAttribute("obowiazuje_od"));
                if (d.isBefore(cutoff)) {
                    startIdx = i; // aktualizuj — chcemy ostatni przed cutoffem
                } else {
                    break;
                }
            }

            log.info("Cutoff: {}, startIdx: {} (ostatnia stopa przed cutoffem)", cutoff, startIdx);

            for (int i = startIdx; i < total; i++) {
                Element group = (Element) groups.item(i);
                LocalDate validFrom = LocalDate.parse(group.getAttribute("obowiazuje_od"));

                // valid_to = dzień przed następną zmianą
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
                            pos.getAttribute("oprocentowanie").replace(",", ".")
                    );

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
        // Zwracamy od pierwszego wpisu w bazie (może być sprzed cutoffu — to poprawne)
        return repo.findByRateIdOrderByValidFromAsc("ref").isEmpty()
                ? repo.findAll()
                : repo.findFromDate(
                repo.findByRateIdOrderByValidFromAsc("ref").get(0).getValidFrom()
        );
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, readOnly = true)
    public List<InterestRate> getByRateId(String rateId) {
        return repo.findByRateIdOrderByValidFromAsc(rateId);
    }
}