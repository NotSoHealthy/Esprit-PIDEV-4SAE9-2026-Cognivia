package com.pidev.games.services;

import com.pidev.games.entities.RecallGameResult;
import com.pidev.games.repositories.RecallGameRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecallGameService {

    private static final Logger log = LoggerFactory.getLogger(RecallGameService.class);

    private final RecallGameRepository repository;
    private final StreakService streakService;

    public RecallGameService(RecallGameRepository repository, StreakService streakService) {
        this.repository = repository;
        this.streakService = streakService;
    }

    public RecallGameResult saveResult(RecallGameResult result) {
        RecallGameResult saved = repository.save(result);

        // Update the patient's streak after every game submission
        if (saved.getPatientId() != null) {
            streakService.updateStreak(saved.getPatientId());
        }

        return saved;
    }

    public List<RecallGameResult> getResultsByPatient(String patientId) {
        return repository.findByPatientId(patientId);
    }

    public List<RecallGameResult> getAllResults() {
        return repository.findAll();
    }
}
