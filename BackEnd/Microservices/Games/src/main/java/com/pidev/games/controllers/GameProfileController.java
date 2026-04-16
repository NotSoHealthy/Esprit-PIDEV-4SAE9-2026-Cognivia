package com.pidev.games.controllers;

import com.pidev.games.entities.GameProfile;
import com.pidev.games.repositories.GameProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/game-profile")
public class GameProfileController {

    private final GameProfileRepository repository;

    public GameProfileController(GameProfileRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<GameProfile> getProfile(@PathVariable String patientId) {
        return repository.findByPatientId(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/save")
    public ResponseEntity<GameProfile> saveProfile(@RequestBody GameProfile profile) {
        Optional<GameProfile> existing = repository.findByPatientId(profile.getPatientId());
        
        if (existing.isPresent()) {
            GameProfile current = existing.get();
            current.setLastRoomId(profile.getLastRoomId());
            current.setLastPosX(profile.getLastPosX());
            current.setLastPosY(profile.getLastPosY());
            current.setLastPosZ(profile.getLastPosZ());
            current.setRecallBestScore(profile.getRecallBestScore());
            current.setMemoryBestScore(profile.getMemoryBestScore());
            return ResponseEntity.ok(repository.save(current));
        } else {
            return ResponseEntity.ok(repository.save(profile));
        }
    }
}
