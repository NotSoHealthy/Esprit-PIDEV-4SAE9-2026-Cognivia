package com.pidev.games.services;

import com.pidev.games.entities.PlayerStreak;
import com.pidev.games.repositories.PlayerStreakRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class StreakService {

    private static final Logger log = LoggerFactory.getLogger(StreakService.class);

    private final PlayerStreakRepository repository;

    public StreakService(PlayerStreakRepository repository) {
        this.repository = repository;
    }

    /**
     * Called after every game submission to update the patient's streak.
     * - Same day: no streak change, just increment totalGamesPlayed.
     * - Consecutive day: streak increments.
     * - Gap > 1 day: streak resets to 1.
     */
    @Transactional
    public PlayerStreak updateStreak(String patientId) {
        if (patientId == null || patientId.isBlank()) {
            log.warn("Cannot update streak: patientId is null or blank");
            return null;
        }

        LocalDate today = LocalDate.now();

        PlayerStreak streak = repository.findByPatientId(patientId)
                .orElse(new PlayerStreak(patientId));

        streak.setTotalGamesPlayed(streak.getTotalGamesPlayed() + 1);

        LocalDate lastActivity = streak.getLastActivityDate();

        if (lastActivity == null) {
            // First time ever playing
            streak.setCurrentStreak(1);
            log.info("Patient {} started their first streak!", patientId);

        } else if (lastActivity.equals(today)) {
            // Already played today — don't increment streak, just count the game
            log.debug("Patient {} already played today, streak stays at {}", patientId, streak.getCurrentStreak());

        } else if (lastActivity.equals(today.minusDays(1))) {
            // Played yesterday — consecutive day!
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
            log.info("Patient {} extended streak to {} days!", patientId, streak.getCurrentStreak());

        } else {
            // Missed a day — streak resets
            streak.setCurrentStreak(1);
            log.info("Patient {} streak reset. Last activity was {}", patientId, lastActivity);
        }

        // Update longest streak record
        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }

        streak.setLastActivityDate(today);

        return repository.save(streak);
    }

    /**
     * Get the current streak data for a patient.
     */
    public PlayerStreak getStreak(String patientId) {
        return repository.findByPatientId(patientId)
                .orElse(new PlayerStreak(patientId));
    }
}
