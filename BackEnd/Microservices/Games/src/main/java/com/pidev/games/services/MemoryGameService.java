package com.pidev.games.services;

import com.pidev.games.entities.MemoryGameResult;
import com.pidev.games.repositories.MemoryGameResultRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MemoryGameService {

    private static final Logger log = LoggerFactory.getLogger(MemoryGameService.class);

    private final MemoryGameResultRepository repository;

    public MemoryGameService(MemoryGameResultRepository repository) {
        this.repository = repository;
    }

    public MemoryGameResult saveResult(MemoryGameResult result) {
        log.info("Saving new memory game result: Score={}, WrongMoves={}", result.getScore(), result.getWrongMoves());
        return repository.save(result);
    }

    public List<MemoryGameResult> getResultsByPatient(String patientId) {
        return repository.findByPatientIdOrderByPlayedAtDesc(patientId);
    }

    public List<MemoryGameResult> getAllResults() {
        return repository.findAll();
    }
}
