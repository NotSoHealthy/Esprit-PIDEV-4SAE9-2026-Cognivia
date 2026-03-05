package com.pidev.games.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recall_game_results")
public class RecallGameResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;

    private int correctCount;
    private int wrongSelections;
    private float responseTime;
    private float accuracy;

    private LocalDateTime playedAt;

    public RecallGameResult() {
    }

    public RecallGameResult(String patientId, int correctCount, int wrongSelections, float responseTime,
            float accuracy) {
        this.patientId = patientId;
        this.correctCount = correctCount;
        this.wrongSelections = wrongSelections;
        this.responseTime = responseTime;
        this.accuracy = accuracy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public int getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(int correctCount) {
        this.correctCount = correctCount;
    }

    public int getWrongSelections() {
        return wrongSelections;
    }

    public void setWrongSelections(int wrongSelections) {
        this.wrongSelections = wrongSelections;
    }

    public float getResponseTime() {
        return responseTime;
    }

    public void setResponseTime(float responseTime) {
        this.responseTime = responseTime;
    }

    public float getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(float accuracy) {
        this.accuracy = accuracy;
    }

    public LocalDateTime getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(LocalDateTime playedAt) {
        this.playedAt = playedAt;
    }

    @PrePersist
    public void prePersist() {
        if (playedAt == null) {
            playedAt = LocalDateTime.now();
        }
    }
}
