package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.AgentMessage;
import com.pidev.pharmacy.services.AgentMessageService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/agent-messages")
@AllArgsConstructor
public class AgentMessageController {

    private final AgentMessageService agentMessageService;

    @GetMapping("/medication/{medicationId}")
    public ResponseEntity<AgentMessage> getMessageForMedication(@PathVariable Long medicationId) {
        return agentMessageService.getMessageForMedication(medicationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pending")
    public List<AgentMessage> getAllPendingMessages() {
        return agentMessageService.getAllPendingMessages();
    }
}
