package com.pidev.pharmacy.config;

import com.pidev.pharmacy.entities.AgentSettings;
import com.pidev.pharmacy.repositories.AgentSettingsRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * Global configuration for Agent Mode.
 * This controls whether the AI automatically accepts/rejects medications
 * or just provides recommendations for manual review.
 */
@Component
@ConfigurationProperties(prefix = "agent")
@RequiredArgsConstructor
@Getter
@Setter
public class AgentModeConfig {

    private final AgentSettingsRepository agentSettingsRepository;
    
    private volatile boolean modeEnabled = false;
    private volatile boolean autoDeleteReviewRequired = false;

    @PostConstruct
    public void initializeFromDatabase() {
        AgentSettings settings = agentSettingsRepository.findById(1L)
                .orElseGet(() -> agentSettingsRepository.save(new AgentSettings()));
        this.modeEnabled = settings.isAgentModeEnabled();
        this.autoDeleteReviewRequired = settings.isAutoDeleteReviewRequired();
    }
    
    public boolean isAgentModeEnabled() {
        return modeEnabled;
    }
    
    public void setAgentModeEnabled(boolean enabled) {
        this.modeEnabled = enabled;
        persistSettings();
    }
    
    public boolean isAutoDeleteReviewRequired() {
        return autoDeleteReviewRequired;
    }
    
    public void setAutoDeleteReviewRequired(boolean enabled) {
        this.autoDeleteReviewRequired = enabled;
        persistSettings();
    }

    private void persistSettings() {
        AgentSettings settings = agentSettingsRepository.findById(1L)
                .orElseGet(AgentSettings::new);
        settings.setId(1L);
        settings.setAgentModeEnabled(this.modeEnabled);
        settings.setAutoDeleteReviewRequired(this.autoDeleteReviewRequired);
        agentSettingsRepository.save(settings);
    }
}
