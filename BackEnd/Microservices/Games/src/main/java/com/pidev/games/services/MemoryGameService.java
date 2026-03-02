package com.pidev.games.services;

import com.pidev.games.entities.MemoryGameResult;
import com.pidev.games.repositories.MemoryGameResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MemoryGameService {

    private static final Logger log = LoggerFactory.getLogger(MemoryGameService.class);

    private final MemoryGameResultRepository repository;
    private final StreakService streakService;

    public MemoryGameService(MemoryGameResultRepository repository, StreakService streakService) {
        this.repository = repository;
        this.streakService = streakService;
    }

    public MemoryGameResult saveResult(MemoryGameResult result) {
        log.info("Saving new memory game result: Score={}, WrongMoves={}", result.getScore(), result.getWrongMoves());
        MemoryGameResult saved = repository.save(result);

        // Update the patient's streak after every game submission
        if (saved.getPatientId() != null) {
            streakService.updateStreak(saved.getPatientId());
        }

        return saved;
    }

    public List<MemoryGameResult> getResultsByPatient(String patientId) {
        return repository.findByPatientIdOrderByPlayedAtDesc(patientId);
    }

    public List<MemoryGameResult> getAllResults() {
        return repository.findAll();
    }
}
