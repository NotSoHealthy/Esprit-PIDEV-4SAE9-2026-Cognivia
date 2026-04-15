package com.pidev.games.services;

import com.pidev.games.entities.PlayerStreak;
import com.pidev.games.repositories.PlayerStreakRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StreakServiceTest {

    @Mock
    private PlayerStreakRepository repository;

    @InjectMocks
    private StreakService streakService;

    private final String patientId = "patient123";

    @Test
    void testUpdateStreak_NewPlayer() {
        when(repository.findByPatientId(patientId)).thenReturn(Optional.empty());
        when(repository.save(any(PlayerStreak.class))).thenAnswer(i -> i.getArgument(0));

        PlayerStreak result = streakService.updateStreak(patientId);

        assertNotNull(result);
        assertEquals(1, result.getCurrentStreak());
        assertEquals(1, result.getTotalGamesPlayed());
        assertEquals(LocalDate.now(), result.getLastActivityDate());
        verify(repository).save(any(PlayerStreak.class));
    }

    @Test
    void testUpdateStreak_SameDay() {
        PlayerStreak existing = new PlayerStreak(patientId);
        existing.setCurrentStreak(5);
        existing.setTotalGamesPlayed(10);
        existing.setLastActivityDate(LocalDate.now());

        when(repository.findByPatientId(patientId)).thenReturn(Optional.of(existing));
        when(repository.save(any(PlayerStreak.class))).thenAnswer(i -> i.getArgument(0));

        PlayerStreak result = streakService.updateStreak(patientId);

        assertEquals(5, result.getCurrentStreak()); // No increment
        assertEquals(11, result.getTotalGamesPlayed()); // Only games played increment
        verify(repository).save(existing);
    }

    @Test
    void testUpdateStreak_ConsecutiveDay() {
        PlayerStreak existing = new PlayerStreak(patientId);
        existing.setCurrentStreak(5);
        existing.setTotalGamesPlayed(10);
        existing.setLastActivityDate(LocalDate.now().minusDays(1));

        when(repository.findByPatientId(patientId)).thenReturn(Optional.of(existing));
        when(repository.save(any(PlayerStreak.class))).thenAnswer(i -> i.getArgument(0));

        PlayerStreak result = streakService.updateStreak(patientId);

        assertEquals(6, result.getCurrentStreak()); // Incremented
        assertEquals(11, result.getTotalGamesPlayed());
        verify(repository).save(existing);
    }

    @Test
    void testUpdateStreak_GracePeriod() {
        PlayerStreak existing = new PlayerStreak(patientId);
        existing.setCurrentStreak(5);
        existing.setTotalGamesPlayed(10);
        existing.setLastActivityDate(LocalDate.now().minusDays(2));

        when(repository.findByPatientId(patientId)).thenReturn(Optional.of(existing));
        when(repository.save(any(PlayerStreak.class))).thenAnswer(i -> i.getArgument(0));

        PlayerStreak result = streakService.updateStreak(patientId);

        assertEquals(5, result.getCurrentStreak()); // Maintained (Grace Period)
        assertEquals(11, result.getTotalGamesPlayed());
        verify(repository).save(existing);
    }

    @Test
    void testUpdateStreak_Reset() {
        PlayerStreak existing = new PlayerStreak(patientId);
        existing.setCurrentStreak(10);
        existing.setTotalGamesPlayed(50);
        existing.setLastActivityDate(LocalDate.now().minusDays(5));

        when(repository.findByPatientId(patientId)).thenReturn(Optional.of(existing));
        when(repository.save(any(PlayerStreak.class))).thenAnswer(i -> i.getArgument(0));

        PlayerStreak result = streakService.updateStreak(patientId);

        assertEquals(1, result.getCurrentStreak()); // Reset
        verify(repository).save(existing);
    }

    @Test
    void testGetStreak_Existing() {
        PlayerStreak existing = new PlayerStreak(patientId);
        existing.setCurrentStreak(7);
        when(repository.findByPatientId(patientId)).thenReturn(Optional.of(existing));

        PlayerStreak result = streakService.getStreak(patientId);

        assertEquals(7, result.getCurrentStreak());
    }

    @Test
    void testGetStreak_New() {
        when(repository.findByPatientId(patientId)).thenReturn(Optional.empty());

        PlayerStreak result = streakService.getStreak(patientId);

        assertEquals(0, result.getCurrentStreak());
        assertEquals(patientId, result.getPatientId());
    }
}
