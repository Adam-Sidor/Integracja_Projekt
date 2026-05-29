package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "interest_rates",
       indexes = {
           @Index(name = "idx_ir_rate_id",    columnList = "rate_id"),
           @Index(name = "idx_ir_valid_from", columnList = "valid_from")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterestRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rate_id", nullable = false, length = 8)
    private String rateId;           // ref, lom, dep, red, dys

    @Column(name = "rate_name", nullable = false, length = 64)
    private String rateName;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal value;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;       // null = obowiązuje aktualnie
}
