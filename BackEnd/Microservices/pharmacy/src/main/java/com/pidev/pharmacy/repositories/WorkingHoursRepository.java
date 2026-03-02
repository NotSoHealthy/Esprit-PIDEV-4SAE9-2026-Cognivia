package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.WorkingHours;
import com.pidev.pharmacy.entities.DayOfWeek;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, Long> {

    List<WorkingHours> findByPharmacyId(Long pharmacyId);

    Optional<WorkingHours> findByPharmacyIdAndDayOfWeek(Long pharmacyId, DayOfWeek dayOfWeek);
}

