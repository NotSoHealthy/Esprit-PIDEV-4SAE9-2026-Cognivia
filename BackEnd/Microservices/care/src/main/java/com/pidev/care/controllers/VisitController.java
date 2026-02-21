package com.pidev.care.controllers;

import com.pidev.care.entities.Visit;
import com.pidev.care.services.VisitService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/visit")
@AllArgsConstructor
public class VisitController {
    private final VisitService visitService;

    @GetMapping
    public List<Visit> getAllVisits() {
        return visitService.getAll();
    }

    @GetMapping("/{id}")
    public Visit getVisitById(@PathVariable Long id) {
        return visitService.getById(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<Visit> getVisitsByPatientId(@PathVariable Long patientId) {
        return visitService.getByPatientId(patientId);
    }

    @PostMapping
    public Visit createVisit(@RequestBody Visit visit) {
        return visitService.create(visit);
    }

    @PutMapping("/{id}")
    public Visit updateVisit(@PathVariable Long id, @RequestBody Visit visit) {
        return visitService.update(id, visit);
    }

    @DeleteMapping("/{id}")
    public void deleteVisit(@PathVariable Long id) {
        visitService.delete(id);
    }
}
