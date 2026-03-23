package com.pidev.games.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PatientGameMetrics {
    private String patientId;
    private int currentStreak;
    private int longestStreak;
    private int totalGamesPlayed;
    private double averageResponseTime; // across all games

    public PatientGameMetrics(String patientId, int currentStreak, int longestStreak, int totalGamesPlayed,
            double averageResponseTime) {
        this.patientId = patientId;
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
        this.totalGamesPlayed = totalGamesPlayed;
        this.averageResponseTime = averageResponseTime;
    }
}
