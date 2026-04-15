package com.pidev.monitoring.controllers;

import com.pidev.monitoring.entities.VisitReport;
import com.pidev.monitoring.services.VisitReportService;
import lombok.AllArgsConstructor;

import org.springframework.security.access.method.P;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/visitreport")
@AllArgsConstructor
public class VisitReportController {
    private final VisitReportService visitReportService;

    @GetMapping
    public List<VisitReport> getAllVisitReports() {
        return visitReportService.getAll();
    }

    @GetMapping("/{id}")
    public VisitReport getVisitReportById(@PathVariable Long id) {
        return visitReportService.getById(id);
    }

    @GetMapping("/visit/{visitId}")
    public VisitReport getVisitReportByVisitId(@PathVariable Long visitId) {
        return visitReportService.getByVisitId(visitId);
    }

    @PreAuthorize("hasRole('CAREGIVER','ADMIN')")
    @PostMapping
    public VisitReport createVisitReport(@RequestBody VisitReport visitReport) {
        return visitReportService.create(visitReport);
    }

    @PutMapping("/{id}")
    public VisitReport updateVisitReport(@PathVariable Long id, @RequestBody VisitReport visitReport) {
        return visitReportService.update(id, visitReport);
    }

    @PreAuthorize("hasAnyRole('CAREGIVER','ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteVisitReport(@PathVariable Long id) {
        visitReportService.delete(id);
    }
}
