package com.example.backend.repository;

import com.example.backend.model.InterestRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface InterestRateRepository extends JpaRepository<InterestRate, Long> {

    List<InterestRate> findByRateIdOrderByValidFromAsc(String rateId);

    @Query("""
        SELECT r FROM InterestRate r
        WHERE r.validFrom >= :from
        ORDER BY r.validFrom ASC
        """)
    List<InterestRate> findFromDate(@Param("from") LocalDate from);

    @Query("""
        SELECT r FROM InterestRate r
        WHERE r.rateId = :rateId
          AND r.validFrom <= :date
          AND (r.validTo IS NULL OR r.validTo >= :date)
        ORDER BY r.validFrom DESC
        """)
    List<InterestRate> findActiveAtDate(
        @Param("rateId") String rateId,
        @Param("date")   LocalDate date
    );

    boolean existsByRateIdAndValidFrom(String rateId, LocalDate validFrom);
}
