package com.pidev.games.controllers;

import com.pidev.games.entities.RecallGameResult;
import com.pidev.games.services.RecallGameService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recall-game")
public class RecallGameController {

    private final RecallGameService service;

    public RecallGameController(RecallGameService service) {
        this.service = service;
    }

    @PostMapping("/submit")
    public RecallGameResult submitResult(@RequestBody RecallGameResult result) {
        return service.saveResult(result);
    }

    @GetMapping("/patient/{patientId}")
    public List<RecallGameResult> getResultsByPatient(@PathVariable String patientId) {
        return service.getResultsByPatient(patientId);
    }

    @GetMapping("/all")
    public List<RecallGameResult> getAllResults() {
        return service.getAllResults();
    }
}
