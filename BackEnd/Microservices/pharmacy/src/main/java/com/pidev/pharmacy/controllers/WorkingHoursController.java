package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.WorkingHours;
import com.pidev.pharmacy.entities.DayOfWeek;
import com.pidev.pharmacy.services.WorkingHoursService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/working-hours")
@AllArgsConstructor
@Slf4j
public class WorkingHoursController {

    private final WorkingHoursService workingHoursService;

    @GetMapping
    public List<WorkingHours> getAllWorkingHours() {
        return workingHoursService.getAll();
    }

    @GetMapping("/{id}")
    public WorkingHours getWorkingHoursById(@PathVariable Long id) {
        return workingHoursService.getById(id);
    }

    @PostMapping
    public ResponseEntity<WorkingHours> createWorkingHours(@RequestBody WorkingHours workingHours) {
        try {
            WorkingHours created = workingHoursService.create(workingHours);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating working hours", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public WorkingHours updateWorkingHours(@PathVariable Long id, @RequestBody WorkingHours workingHours) {
        return workingHoursService.update(id, workingHours);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkingHours(@PathVariable Long id) {
        workingHoursService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all working hours for a pharmacy
     */
    @GetMapping("/pharmacy/{pharmacyId}")
    public List<WorkingHours> getWorkingHoursByPharmacy(@PathVariable Long pharmacyId) {
        return workingHoursService.getWorkingHoursByPharmacy(pharmacyId);
    }

    /**
     * Get working hours for a specific day
     */
    @GetMapping("/pharmacy/{pharmacyId}/day/{day}")
    public ResponseEntity<WorkingHours> getWorkingHoursByDay(
            @PathVariable Long pharmacyId,
            @PathVariable String day) {
        try {
            DayOfWeek dayOfWeek = DayOfWeek.valueOf(day.toUpperCase());
            WorkingHours hours = workingHoursService.getWorkingHoursByDay(pharmacyId, dayOfWeek);
            return ResponseEntity.ok(hours);
        } catch (IllegalArgumentException e) {
            log.error("Invalid day: {}", day);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Check if pharmacy is open
     */
    @GetMapping("/pharmacy/{pharmacyId}/is-open")
    public ResponseEntity<Boolean> isPharmacyOpen(
            @PathVariable Long pharmacyId,
            @RequestParam String day,
            @RequestParam String time) {
        try {
            DayOfWeek dayOfWeek = DayOfWeek.valueOf(day.toUpperCase());
            LocalTime localTime = LocalTime.parse(time); // format: HH:MM
            boolean isOpen = workingHoursService.isPharmacyOpen(pharmacyId, dayOfWeek, localTime);
            return ResponseEntity.ok(isOpen);
        } catch (Exception e) {
            log.error("Error checking pharmacy open status", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update working hours for a specific day
     */
    @PatchMapping("/pharmacy/{pharmacyId}/day/{day}")
    public ResponseEntity<WorkingHours> updateDayWorkingHours(
            @PathVariable Long pharmacyId,
            @PathVariable String day,
            @RequestParam(required = false) String openTime,
            @RequestParam(required = false) String closeTime,
            @RequestParam(required = false) Boolean isClosed) {
        try {
            DayOfWeek dayOfWeek = DayOfWeek.valueOf(day.toUpperCase());
            LocalTime open = openTime != null ? LocalTime.parse(openTime) : null;
            LocalTime close = closeTime != null ? LocalTime.parse(closeTime) : null;

            WorkingHours updated = workingHoursService.updateDayWorkingHours(pharmacyId, dayOfWeek, open, close, isClosed);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating working hours", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Close pharmacy for a specific day
     */
    @PostMapping("/pharmacy/{pharmacyId}/close/{day}")
    public ResponseEntity<WorkingHours> closePharmacyForDay(
            @PathVariable Long pharmacyId,
            @PathVariable String day) {
        try {
            DayOfWeek dayOfWeek = DayOfWeek.valueOf(day.toUpperCase());
            WorkingHours closed = workingHoursService.closePharmacyForDay(pharmacyId, dayOfWeek);
            return ResponseEntity.ok(closed);
        } catch (Exception e) {
            log.error("Error closing pharmacy", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Open pharmacy for a specific day
     */
    @PostMapping("/pharmacy/{pharmacyId}/open/{day}")
    public ResponseEntity<WorkingHours> openPharmacyForDay(
            @PathVariable Long pharmacyId,
            @PathVariable String day,
            @RequestParam String openTime,
            @RequestParam String closeTime) {
        try {
            DayOfWeek dayOfWeek = DayOfWeek.valueOf(day.toUpperCase());
            LocalTime open = LocalTime.parse(openTime);
            LocalTime close = LocalTime.parse(closeTime);

            WorkingHours opened = workingHoursService.openPharmacyForDay(pharmacyId, dayOfWeek, open, close);
            return ResponseEntity.ok(opened);
        } catch (Exception e) {
            log.error("Error opening pharmacy", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Initialize default working hours for all days
     */
    @PostMapping("/pharmacy/{pharmacyId}/initialize-default")
    public ResponseEntity<Void> initializeDefaultWorkingHours(
            @PathVariable Long pharmacyId,
            @RequestParam String openTime,
            @RequestParam String closeTime) {
        try {
            LocalTime open = LocalTime.parse(openTime);
            LocalTime close = LocalTime.parse(closeTime);

            workingHoursService.initializeDefaultWorkingHours(pharmacyId, open, close);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error initializing default working hours", e);
            return ResponseEntity.badRequest().build();
        }
    }
}

