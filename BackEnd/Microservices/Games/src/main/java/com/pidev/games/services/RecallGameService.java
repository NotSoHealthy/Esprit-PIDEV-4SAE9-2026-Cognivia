package com.pidev.games.services;

import com.pidev.games.entities.RecallGameResult;
import com.pidev.games.repositories.RecallGameRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecallGameService {

    private final RecallGameRepository repository;

    public RecallGameService(RecallGameRepository repository) {
        this.repository = repository;
    }

    public RecallGameResult saveResult(RecallGameResult result) {
        return repository.save(result);
    }

    public List<RecallGameResult> getResultsByPatient(String patientId) {
        return repository.findByPatientId(patientId);
    }

    public List<RecallGameResult> getAllResults() {
        return repository.findAll();
    }
}
