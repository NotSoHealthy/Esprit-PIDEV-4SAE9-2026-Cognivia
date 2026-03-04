package com.pidev.pharmacy.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AgentSettings {

    @Id
    private Long id = 1L;

    private boolean agentModeEnabled = false;

    private boolean autoDeleteReviewRequired = false;
}
