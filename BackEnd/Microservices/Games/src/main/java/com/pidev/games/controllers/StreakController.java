package com.pidev.games.controllers;

import com.pidev.games.entities.PlayerStreak;
import com.pidev.games.services.StreakService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/streak")
public class StreakController {

    private final StreakService streakService;

    public StreakController(StreakService streakService) {
        this.streakService = streakService;
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<PlayerStreak> getStreak(@PathVariable String patientId) {
        PlayerStreak streak = streakService.getStreak(patientId);
        return ResponseEntity.ok(streak);
    }
}
