package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.backend.model.ApartmentPrice;
import java.util.List;
import java.util.Optional;

public interface ApartmentPriceRepository extends JpaRepository<ApartmentPrice, Long> {

    List<ApartmentPrice> findByRegion_CityOrderByYearAscQuarterAsc(String city);

    List<ApartmentPrice> findByYearAndQuarterOrderByRegion_CityAsc(int year, int quarter);

    Optional<ApartmentPrice> findByRegion_IdAndPropertyType_IdAndYearAndQuarter(
        Long regionId, Long propertyTypeId, int year, int quarter
    );

    @Query("""
        SELECT ap FROM ApartmentPrice ap
        JOIN FETCH ap.region r
        JOIN FETCH ap.propertyType pt
        WHERE r.city = :city
          AND pt.marketType = :marketType
          AND ap.year >= :fromYear
        ORDER BY ap.year ASC, ap.quarter ASC
        """)
    List<ApartmentPrice> findByCityAndMarketType(
        @Param("city")       String city,
        @Param("marketType") com.example.backend.model.PropertyType.MarketType marketType,
        @Param("fromYear")   int fromYear
    );

    @Query("""
        SELECT ap FROM ApartmentPrice ap
        JOIN FETCH ap.region
        JOIN FETCH ap.propertyType
        WHERE ap.year BETWEEN :fromYear AND :toYear
        ORDER BY ap.region.city ASC, ap.year ASC, ap.quarter ASC
        """)
    List<ApartmentPrice> findByYearRange(
        @Param("fromYear") int fromYear,
        @Param("toYear")   int toYear
    );

    boolean existsByRegion_IdAndPropertyType_IdAndYearAndQuarter(
        Long regionId, Long propertyTypeId, int year, int quarter
    );
}
