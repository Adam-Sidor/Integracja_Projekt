package com.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "regions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String city;

    @Column(nullable = false, length = 64)
    private String voivodeship;

    @OneToMany(mappedBy = "region", fetch = FetchType.LAZY)
    private List<ApartmentPrice> prices;
}
