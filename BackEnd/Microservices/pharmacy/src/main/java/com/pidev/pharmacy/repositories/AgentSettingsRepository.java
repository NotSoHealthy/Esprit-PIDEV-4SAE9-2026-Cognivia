package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.AgentSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentSettingsRepository extends JpaRepository<AgentSettings, Long> {
}
