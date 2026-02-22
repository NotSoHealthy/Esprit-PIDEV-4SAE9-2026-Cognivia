package org.example.dpchat.controllers;

import org.example.dpchat.entities.Message;
import org.example.dpchat.services.MessageService;
import org.example.dpchat.services.UserLookupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    private final MessageService messageService;
    private final UserLookupService userLookupService;

    public ChatController(MessageService messageService, UserLookupService userLookupService) {
        System.out.println("ChatController initialized!");
        this.messageService = messageService;
        this.userLookupService = userLookupService;
    }

    @GetMapping("/root-test")
    public String rootTest() {
        return "Chat Service root is reachable!";
    }

    @GetMapping("/chat/test")
    public String test() {
        return "Chat Service is reachable!";
    }

    @PostMapping("/chat/send")
    public ResponseEntity<Message> sendMessage(@RequestBody Message message) {
        return ResponseEntity.ok(messageService.sendMessage(message));
    }

    @GetMapping("/chat/conversation")
    public ResponseEntity<List<Message>> getConversation(
            @RequestParam("user1") String user1,
            @RequestParam("user2") String user2) {
        return ResponseEntity.ok(messageService.getConversation(user1, user2));
    }

    @GetMapping("/chat/contacts/{userId}")
    public ResponseEntity<List<String>> getRecentContacts(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(messageService.getRecentContacts(userId));
    }

    @GetMapping("/chat/users")
    public ResponseEntity<List<UserLookupService.UserProfile>> getAllUsers() {
        return ResponseEntity.ok(userLookupService.getAllUsers());
    }

    @GetMapping("/chat/user/{userId}")
    public ResponseEntity<Map<String, String>> getUserInfo(@PathVariable("userId") String userId) {
        return userLookupService.lookupUser(userId)
                .map(profile -> ResponseEntity.ok(Map.of(
                        "id", userId,
                        "name", profile.name,
                        "role", profile.role)))
                .orElse(ResponseEntity.ok(Map.of(
                        "id", userId,
                        "name", userId.substring(0, Math.min(8, userId.length())),
                        "role", "User")));
    }

    @PutMapping("/chat/read/{messageId}")
    public ResponseEntity<Void> markAsRead(@PathVariable("messageId") Long messageId) {
        messageService.markAsRead(messageId);
        return ResponseEntity.ok().build();
    }
}
