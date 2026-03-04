package com.pidev.games.entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "player_streaks")
public class PlayerStreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String patientId;

    private int currentStreak;
    private int longestStreak;
    private int totalGamesPlayed;

    private LocalDate lastActivityDate;

    public PlayerStreak() {
    }

    public PlayerStreak(String patientId) {
        this.patientId = patientId;
        this.currentStreak = 0;
        this.longestStreak = 0;
        this.totalGamesPlayed = 0;
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

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }

    public int getTotalGamesPlayed() {
        return totalGamesPlayed;
    }

    public void setTotalGamesPlayed(int totalGamesPlayed) {
        this.totalGamesPlayed = totalGamesPlayed;
    }

    public LocalDate getLastActivityDate() {
        return lastActivityDate;
    }

    public void setLastActivityDate(LocalDate lastActivityDate) {
        this.lastActivityDate = lastActivityDate;
    }
}
