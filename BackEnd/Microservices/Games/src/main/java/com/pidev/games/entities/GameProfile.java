package com.pidev.games.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "game_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String patientId; // Maps to Keycloak user ID/username

    private String lastRoomId = "FeatureTestScene";
    private float lastPosX;
    private float lastPosY;
    private float lastPosZ;

    private float recallBestScore;
    private int memoryBestScore;
}
