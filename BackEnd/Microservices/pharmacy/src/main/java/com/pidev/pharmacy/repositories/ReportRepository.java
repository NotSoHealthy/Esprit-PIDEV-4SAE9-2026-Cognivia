package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.Report;
import com.pidev.pharmacy.entities.ReportReason;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByPharmacyId(Long pharmacyId);

    long deleteByPharmacyId(Long pharmacyId);

    List<Report> findByReason(ReportReason reason);
}

