package com.pidev.games.services;

import com.pidev.games.entities.MemoryGameResult;
import com.pidev.games.repositories.MemoryGameResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MemoryGameServiceTest {

    @Mock
    private MemoryGameResultRepository repository;

    @Mock
    private StreakService streakService;

    @InjectMocks
    private MemoryGameService memoryGameService;

    private MemoryGameResult testResult;

    @BeforeEach
    void setUp() {
        testResult = new MemoryGameResult();
        testResult.setId(1L);
        testResult.setPatientId("patient123");
        testResult.setScore(100);
        testResult.setWrongMoves(2);
        testResult.setPlayedAt(LocalDateTime.now());
    }

    @Test
    void testSaveResult_Success() {
        when(repository.save(any(MemoryGameResult.class))).thenReturn(testResult);

        MemoryGameResult result = memoryGameService.saveResult(testResult);

        assertNotNull(result);
        assertEquals(100, result.getScore());
        verify(repository).save(testResult);
        verify(streakService).updateStreak("patient123");
    }

    @Test
    void testSaveResult_NoPatientId() {
        testResult.setPatientId(null);
        when(repository.save(any(MemoryGameResult.class))).thenReturn(testResult);

        MemoryGameResult result = memoryGameService.saveResult(testResult);

        assertNotNull(result);
        verify(repository).save(testResult);
        verify(streakService, never()).updateStreak(anyString());
    }

    @Test
    void testGetResultsByPatient() {
        when(repository.findByPatientIdOrderByPlayedAtDesc("patient123"))
                .thenReturn(Collections.singletonList(testResult));

        List<MemoryGameResult> results = memoryGameService.getResultsByPatient("patient123");

        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        verify(repository).findByPatientIdOrderByPlayedAtDesc("patient123");
    }

    @Test
    void testGetAllResults() {
        when(repository.findAll()).thenReturn(Collections.singletonList(testResult));

        List<MemoryGameResult> results = memoryGameService.getAllResults();

        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        verify(repository).findAll();
    }
}
