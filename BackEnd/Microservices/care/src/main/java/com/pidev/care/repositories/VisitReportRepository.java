package com.pidev.care.repositories;

import com.pidev.care.entities.VisitReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VisitReportRepository extends JpaRepository<VisitReport, Long> {
}
