package com.pidev.monitoring.repositories;

import com.pidev.monitoring.entities.VisitReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitReportRepository extends JpaRepository<VisitReport, Long> {
    List<VisitReport> findByVisitId(Long visitId);
}
