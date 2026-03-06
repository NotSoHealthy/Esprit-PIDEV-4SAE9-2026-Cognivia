package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.WorkingHours;
import com.pidev.pharmacy.entities.DayOfWeek;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.repositories.WorkingHoursRepository;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class WorkingHoursService implements IService<WorkingHours> {

    private final WorkingHoursRepository workingHoursRepository;
    private final PharmacyRepository pharmacyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WorkingHours> getAll() {
        return workingHoursRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public WorkingHours getById(Long id) {
        return workingHoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Working Hours not found with id: " + id));
    }

    @Override
    @Transactional
    public WorkingHours create(WorkingHours entity) {
        entity.setId(null);

        // Verify pharmacy exists
        Pharmacy pharmacy = pharmacyRepository.findById(entity.getPharmacy().getId())
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + entity.getPharmacy().getId()));

        entity.setPharmacy(pharmacy);

        // Validate times
        if (!entity.getIsClosed() && entity.getOpenTime() != null && entity.getCloseTime() != null) {
            if (entity.getCloseTime().isBefore(entity.getOpenTime())) {
                throw new RuntimeException("Close time cannot be before open time");
            }
        }

        log.info("Creating working hours for pharmacy {} day {} open {} close {}",
                pharmacy.getId(), entity.getDayOfWeek(), entity.getOpenTime(), entity.getCloseTime());
        return workingHoursRepository.save(entity);
    }

    @Override
    @Transactional
    public WorkingHours update(Long id, WorkingHours entity) {
        WorkingHours existing = getById(id);

        if (entity.getOpenTime() != null) {
            existing.setOpenTime(entity.getOpenTime());
        }

        if (entity.getCloseTime() != null) {
            existing.setCloseTime(entity.getCloseTime());
        }

        if (entity.getIsClosed() != null) {
            existing.setIsClosed(entity.getIsClosed());
        }

        // Validate times
        if (!existing.getIsClosed() && existing.getOpenTime() != null && existing.getCloseTime() != null) {
            if (existing.getCloseTime().isBefore(existing.getOpenTime())) {
                throw new RuntimeException("Close time cannot be before open time");
            }
        }

        log.info("Updating working hours {} open {} close {}", id, entity.getOpenTime(), entity.getCloseTime());
        return workingHoursRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        WorkingHours existing = getById(id);
        workingHoursRepository.delete(existing);
        log.info("Deleted working hours with id: {}", id);
    }

    /**
     * Get all working hours for a pharmacy
     */
    @Transactional(readOnly = true)
    public List<WorkingHours> getWorkingHoursByPharmacy(Long pharmacyId) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        return workingHoursRepository.findByPharmacyId(pharmacyId);
    }

    /**
     * Get working hours for a specific day
     */
    @Transactional(readOnly = true)
    public WorkingHours getWorkingHoursByDay(Long pharmacyId, DayOfWeek dayOfWeek) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        return workingHoursRepository.findByPharmacyIdAndDayOfWeek(pharmacyId, dayOfWeek)
                .orElseThrow(() -> new RuntimeException("Working hours not found for pharmacy " + pharmacyId + " on " + dayOfWeek));
    }

    /**
     * Check if pharmacy is open at a specific time
     */
    @Transactional(readOnly = true)
    public boolean isPharmacyOpen(Long pharmacyId, DayOfWeek dayOfWeek, LocalTime time) {
        try {
            WorkingHours hours = getWorkingHoursByDay(pharmacyId, dayOfWeek);

            if (hours.getIsClosed()) {
                return false;
            }

            if (hours.getOpenTime() == null || hours.getCloseTime() == null) {
                return false;
            }

            return !time.isBefore(hours.getOpenTime()) && !time.isAfter(hours.getCloseTime());
        } catch (Exception e) {
            log.warn("Error checking pharmacy open status: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Update working hours for a specific day
     */
    @Transactional
    public WorkingHours updateDayWorkingHours(Long pharmacyId, DayOfWeek dayOfWeek,
                                              LocalTime openTime, LocalTime closeTime, Boolean isClosed) {
        WorkingHours hours = getWorkingHoursByDay(pharmacyId, dayOfWeek);

        if (openTime != null) {
            hours.setOpenTime(openTime);
        }

        if (closeTime != null) {
            hours.setCloseTime(closeTime);
        }

        if (isClosed != null) {
            hours.setIsClosed(isClosed);
        }

        // Validate times
        if (!hours.getIsClosed() && hours.getOpenTime() != null && hours.getCloseTime() != null) {
            if (hours.getCloseTime().isBefore(hours.getOpenTime())) {
                throw new RuntimeException("Close time cannot be before open time");
            }
        }

        log.info("Updated working hours for pharmacy {} on {} to {} - {}",
                pharmacyId, dayOfWeek, openTime, closeTime);
        return workingHoursRepository.save(hours);
    }

    /**
     * Close pharmacy for a specific day
     */
    @Transactional
    public WorkingHours closePharmacyForDay(Long pharmacyId, DayOfWeek dayOfWeek) {
        WorkingHours hours = getWorkingHoursByDay(pharmacyId, dayOfWeek);
        hours.setIsClosed(true);

        log.info("Closed pharmacy {} for {}", pharmacyId, dayOfWeek);
        return workingHoursRepository.save(hours);
    }

    /**
     * Open pharmacy for a specific day with default hours
     */
    @Transactional
    public WorkingHours openPharmacyForDay(Long pharmacyId, DayOfWeek dayOfWeek,
                                           LocalTime openTime, LocalTime closeTime) {
        WorkingHours hours = getWorkingHoursByDay(pharmacyId, dayOfWeek);
        hours.setIsClosed(false);
        hours.setOpenTime(openTime);
        hours.setCloseTime(closeTime);

        log.info("Opened pharmacy {} for {} from {} to {}", pharmacyId, dayOfWeek, openTime, closeTime);
        return workingHoursRepository.save(hours);
    }

    /**
     * Initialize default working hours for a pharmacy (all days, same hours)
     */
    @Transactional
    public void initializeDefaultWorkingHours(Long pharmacyId, LocalTime openTime, LocalTime closeTime) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        for (DayOfWeek day : DayOfWeek.values()) {
            try {
                getWorkingHoursByDay(pharmacyId, day);
            } catch (Exception e) {
                // Create if doesn't exist
                WorkingHours hours = new WorkingHours();
                hours.setPharmacy(pharmacyRepository.findById(pharmacyId).get());
                hours.setDayOfWeek(day);
                hours.setOpenTime(openTime);
                hours.setCloseTime(closeTime);
                hours.setIsClosed(false);
                workingHoursRepository.save(hours);
                log.info("Created default working hours for pharmacy {} on {}", pharmacyId, day);
            }
        }
    }
}

