package com.pidev.games.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "memory_game_results")
public class MemoryGameResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId; // nullable for now, can be linked to patient later

    private int score;
    private int timeInSeconds;
    private int difficulty; // e.g., 3 for Easy, 6 for Medium, 9 for Hard

    private int wrongMoves;
    private int duplicateMoves;

    private LocalDateTime playedAt;

    public MemoryGameResult() {
    }

    public MemoryGameResult(String patientId, int score, int timeInSeconds, int difficulty, int wrongMoves,
            int duplicateMoves, LocalDateTime playedAt) {
        this.patientId = patientId;
        this.score = score;
        this.timeInSeconds = timeInSeconds;
        this.difficulty = difficulty;
        this.wrongMoves = wrongMoves;
        this.duplicateMoves = duplicateMoves;
        this.playedAt = playedAt;
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

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getTimeInSeconds() {
        return timeInSeconds;
    }

    public void setTimeInSeconds(int timeInSeconds) {
        this.timeInSeconds = timeInSeconds;
    }

    public int getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(int difficulty) {
        this.difficulty = difficulty;
    }

    public int getWrongMoves() {
        return wrongMoves;
    }

    public void setWrongMoves(int wrongMoves) {
        this.wrongMoves = wrongMoves;
    }

    public int getDuplicateMoves() {
        return duplicateMoves;
    }

    public void setDuplicateMoves(int duplicateMoves) {
        this.duplicateMoves = duplicateMoves;
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
