package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.config.AgentModeConfig;
import com.pidev.pharmacy.dto.AgentModeDTO;
import com.pidev.pharmacy.dto.AutoDeleteReviewRequiredDTO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing global Agent Mode configuration
 */
@RestController
@RequestMapping("/config")
@AllArgsConstructor
@Slf4j
public class ConfigController {

    private final AgentModeConfig agentModeConfig;

    @GetMapping("/agent-mode")
    public ResponseEntity<AgentModeDTO> getAgentMode() {
        boolean enabled = agentModeConfig.isAgentModeEnabled();
        log.info("Agent mode status requested: {}", enabled);
        return ResponseEntity.ok(new AgentModeDTO(enabled));
    }

    @PutMapping("/agent-mode")
    public ResponseEntity<AgentModeDTO> updateAgentMode(@RequestBody AgentModeDTO dto) {
        boolean previousValue = agentModeConfig.isAgentModeEnabled();
        boolean newValue = dto.getAgentModeEnabled() != null && dto.getAgentModeEnabled();
        agentModeConfig.setAgentModeEnabled(newValue);
        log.info("Agent mode changed: {} -> {}", previousValue, newValue);
        return ResponseEntity.ok(new AgentModeDTO(newValue));
    }

    @GetMapping("/auto-delete-review-required")
    public ResponseEntity<AutoDeleteReviewRequiredDTO> getAutoDeleteReviewRequired() {
        boolean enabled = agentModeConfig.isAutoDeleteReviewRequired();
        log.info("Auto-delete review required status requested: {}", enabled);
        return ResponseEntity.ok(new AutoDeleteReviewRequiredDTO(enabled));
    }

    @PutMapping("/auto-delete-review-required")
    public ResponseEntity<AutoDeleteReviewRequiredDTO> updateAutoDeleteReviewRequired(@RequestBody AutoDeleteReviewRequiredDTO dto) {
        boolean previousValue = agentModeConfig.isAutoDeleteReviewRequired();
        boolean newValue = dto.getAutoDeleteReviewRequired() != null && dto.getAutoDeleteReviewRequired();
        agentModeConfig.setAutoDeleteReviewRequired(newValue);
        log.info("Auto-delete review required changed: {} -> {}", previousValue, newValue);
        return ResponseEntity.ok(new AutoDeleteReviewRequiredDTO(newValue));
    }
}
