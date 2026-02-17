package com.pidev.care.controllers;

import com.pidev.care.entities.VisitReport;
import com.pidev.care.services.VisitReportService;
import lombok.AllArgsConstructor;
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

    @PostMapping
    public VisitReport createVisitReport(@RequestBody VisitReport visitReport) {
        return visitReportService.create(visitReport);
    }

    @PutMapping("/{id}")
    public VisitReport updateVisitReport(@PathVariable Long id, @RequestBody VisitReport visitReport) {
        return visitReportService.update(id, visitReport);
    }

    @DeleteMapping("/{id}")
    public void deleteVisitReport(@PathVariable Long id) {
        visitReportService.delete(id);
    }
}
