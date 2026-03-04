package com.pidev.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExternalMetricsDTO {
    private String patientId;
    private int currentStreak;
    private int longestStreak;
    private int totalGamesPlayed;
    private double averageResponseTime;
}
