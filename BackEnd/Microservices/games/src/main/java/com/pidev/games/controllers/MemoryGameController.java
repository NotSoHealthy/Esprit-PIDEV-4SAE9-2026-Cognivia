package com.pidev.games.controllers;

import com.pidev.games.entities.MemoryGameResult;
import com.pidev.games.services.MemoryGameService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/memory")
public class MemoryGameController {

    private static final Logger log = LoggerFactory.getLogger(MemoryGameController.class);

    private final MemoryGameService service;

    public MemoryGameController(MemoryGameService service) {
        this.service = service;
    }

    @PostMapping("/results")
    public ResponseEntity<MemoryGameResult> saveResult(@RequestBody MemoryGameResult result) {
        log.info("Received game result submission from Unity");
        MemoryGameResult savedResult = service.saveResult(result);
        return ResponseEntity.ok(savedResult);
    }

    @GetMapping("/results")
    public ResponseEntity<List<MemoryGameResult>> getAllResults() {
        return ResponseEntity.ok(service.getAllResults());
    }

    @GetMapping("/results/patient/{patientId}")
    public ResponseEntity<List<MemoryGameResult>> getResultsByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(service.getResultsByPatient(patientId));
    }
}
