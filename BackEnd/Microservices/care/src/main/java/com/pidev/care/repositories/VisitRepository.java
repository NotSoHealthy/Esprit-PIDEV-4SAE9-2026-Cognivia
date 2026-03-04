package com.pidev.care.repositories;

import com.pidev.care.entities.Visit;
import com.pidev.care.entities.VisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {
    List<Visit> findByPatientId(Long patientId);
    @Query("""
        update Visit v
           set v.status = :MISSED
         where v.status = :SCHEDULED
           and v.date < :today
        """)
    int markMissedForPastScheduled(LocalDate today, VisitStatus scheduled, VisitStatus missed);

    List<Visit> findByCaregiverId(Long caregiverId);
}