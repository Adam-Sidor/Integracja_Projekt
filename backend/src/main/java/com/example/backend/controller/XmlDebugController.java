package com.example.backend.controller;

import com.example.backend.config.NbpProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.w3c.dom.*;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class XmlDebugController {

    private final NbpProperties props;

    public XmlDebugController(NbpProperties props) {
        this.props = props;
    }

    @GetMapping("/xml-preview")
    public ResponseEntity<?> xmlPreview() {
        List<Map<String, Object>> result = new ArrayList<>();
        try (InputStream in = URI.create(props.getRatesUrl()).toURL().openStream()) {
            Document doc = DocumentBuilderFactory.newInstance()
                    .newDocumentBuilder().parse(in);
            NodeList groups = doc.getElementsByTagName("pozycje");

            // Pokaż pierwsze 5 i ostatnie 5 grup
            int total = groups.getLength();
            for (int i = 0; i < total; i++) {
                if (i >= 5 && i < total - 5) continue;
                Element group = (Element) groups.item(i);
                String date = group.getAttribute("obowiazuje_od");
                NodeList positions = group.getElementsByTagName("pozycja");
                List<String> rates = new ArrayList<>();
                for (int j = 0; j < positions.getLength(); j++) {
                    Element p = (Element) positions.item(j);
                    rates.add(p.getAttribute("id") + "=" + p.getAttribute("oprocentowanie"));
                }
                result.add(Map.of("index", i, "obowiazuje_od", date, "rates", rates));
            }
            result.add(0, Map.of("total_groups", total));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
        return ResponseEntity.ok(result);
    }
}