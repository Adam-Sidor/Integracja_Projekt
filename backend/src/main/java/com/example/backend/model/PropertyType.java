package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "property_types",
       uniqueConstraints = @UniqueConstraint(columnNames = {"market_type", "price_type"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "market_type", nullable = false, length = 16)
    private MarketType marketType;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_type", nullable = false, length = 16)
    private PriceType priceType;

    @OneToMany(mappedBy = "propertyType", fetch = FetchType.LAZY)
    private List<ApartmentPrice> prices;

    public enum MarketType {
        pierwotny, wtórny
    }

    public enum PriceType {
        ofertowa, transakcyjna, hedoniczna
    }
}
