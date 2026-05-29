package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "apartment_prices",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"region_id", "property_type_id", "year", "quarter"}
       ),
       indexes = {
           @Index(name = "idx_ap_year_quarter",  columnList = "year,quarter"),
           @Index(name = "idx_ap_region",        columnList = "region_id"),
           @Index(name = "idx_ap_property_type", columnList = "property_type_id")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApartmentPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_type_id", nullable = false)
    private PropertyType propertyType;

    @Column(name = "price_per_sqm", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerSqm;

    @Column(nullable = false)
    private Short year;

    @Column(nullable = false)
    private Byte quarter;

    @Column(name = "fetched_at", nullable = false, updatable = false)
    private LocalDateTime fetchedAt = LocalDateTime.now();
}
