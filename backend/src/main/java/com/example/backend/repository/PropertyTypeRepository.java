package com.example.backend.repository;

import com.example.backend.model.PropertyType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PropertyTypeRepository extends JpaRepository<PropertyType, Long> {
    Optional<PropertyType> findByMarketTypeAndPriceType(PropertyType.MarketType marketType, PropertyType.PriceType priceType);
}
