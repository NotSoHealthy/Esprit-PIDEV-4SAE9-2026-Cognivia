package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.Report;
import com.pidev.pharmacy.entities.ReportReason;
import com.pidev.pharmacy.services.ReportService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@AllArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    public List<Report> getAll() {
        return reportService.getAll();
    }

    @GetMapping("/{id}")
    public Report getById(@PathVariable Long id) {
        return reportService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Report> create(@RequestBody Report report) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(report));
    }

    @PutMapping("/{id}")
    public Report update(@PathVariable Long id, @RequestBody Report report) {
        return reportService.update(id, report);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reportService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pharmacy/{pharmacyId}")
    public List<Report> getByPharmacy(@PathVariable Long pharmacyId) {
        return reportService.getByPharmacy(pharmacyId);
    }

    @GetMapping("/reason/{reason}")
    public List<Report> getByReason(@PathVariable ReportReason reason) {
        return reportService.getByReason(reason);
    }
}

