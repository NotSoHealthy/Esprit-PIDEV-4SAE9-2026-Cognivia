package com.pidev.games.controllers;

import com.pidev.games.dto.PatientGameMetrics;
import com.pidev.games.entities.PlayerStreak;
import com.pidev.games.services.StreakService;
import com.pidev.games.services.MemoryGameService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/game-metrics")
public class GameMetricsController {

    private final StreakService streakService;
    private final MemoryGameService memoryGameService;

    public GameMetricsController(StreakService streakService, MemoryGameService memoryGameService) {
        this.streakService = streakService;
        this.memoryGameService = memoryGameService;
    }

    @GetMapping("/patient/{patientId}")
    public PatientGameMetrics getMetrics(@PathVariable String patientId) {
        PlayerStreak streak = streakService.getStreak(patientId);

        // Simplified avg response time across memory games for this patient
        double avgRT = memoryGameService.getAllResults().stream()
                .filter(r -> r.getPatientId().equals(patientId))
                .mapToLong(r -> (long) r.getTimeInSeconds())
                .average()
                .orElse(0.0);

        return new PatientGameMetrics(
                patientId,
                streak.getCurrentStreak(),
                streak.getLongestStreak(),
                streak.getTotalGamesPlayed(),
                avgRT * 1000);
    }
}
