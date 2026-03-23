package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.AgentLog;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.services.AgentLogService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing Agent Logs
 */
@RestController
@RequestMapping("/agent-logs")
@AllArgsConstructor
@Slf4j
public class AgentLogController {

    private final AgentLogService agentLogService;

    @GetMapping
    public List<AgentLog> getAllLogs() {
        log.info("Fetching all agent logs");
        return agentLogService.getAllLogs();
    }

    @PostMapping("/{logId}/undo")
    public ResponseEntity<Medication> undoAction(@PathVariable Long logId) {
        log.info("Attempting to undo agent log with ID: {}", logId);
        try {
            Medication medication = agentLogService.undoAction(logId);
            return ResponseEntity.ok(medication);
        } catch (Exception e) {
            log.error("Failed to undo action for log {}: {}", logId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{logId}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long logId) {
        log.info("Deleting agent log with ID: {}", logId);
        try {
            agentLogService.deleteLog(logId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete log {}: {}", logId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
}
