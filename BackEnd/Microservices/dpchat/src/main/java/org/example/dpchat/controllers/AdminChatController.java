package org.example.dpchat.controllers;

import lombok.RequiredArgsConstructor;
import org.example.dpchat.entities.ChatReport;
import org.example.dpchat.entities.Message;
import org.example.dpchat.services.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat/admin")
@RequiredArgsConstructor
public class AdminChatController {

    private final MessageService messageService;

    @GetMapping("/reports")
    public ResponseEntity<List<org.example.dpchat.dto.ChatReportDTO>> getAllReports() {
        return ResponseEntity.ok(messageService.getAllReports());
    }

    @PostMapping("/reports/{id}/resolve")
    public ResponseEntity<Void> resolveReport(@PathVariable("id") Long id) {
        messageService.resolveReport(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/restrict")
    public ResponseEntity<Void> restrictUser(@RequestBody RestrictUserRequest request) {
        messageService.restrictUser(request.userId, request.type, request.durationInHours, request.reason);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/conversation-context")
    public ResponseEntity<List<Message>> getConversationContext(
            @RequestParam(value = "user1", required = false) String user1,
            @RequestParam(value = "user2", required = false) String user2,
            @RequestParam(value = "groupId", required = false) Long groupId,
            @RequestParam(value = "messageId", required = false) Long messageId) {
        
        return ResponseEntity.ok(messageService.getConversationContext(user1, user2, groupId, messageId));
    }

    public static class RestrictUserRequest {
        public String userId;
        public String type; // BAN, TIMEOUT
        public Integer durationInHours;
        public String reason;
    }
}
