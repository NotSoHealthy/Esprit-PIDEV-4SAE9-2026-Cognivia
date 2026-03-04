package org.example.dpchat.controllers;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.example.dpchat.dto.ChatSummaryDTO;
import org.example.dpchat.entities.Message;
import org.example.dpchat.entities.MessageReaction;
import org.example.dpchat.entities.ReactionType;
import org.example.dpchat.services.MessageService;
import org.example.dpchat.services.UserLookupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;
    private final UserLookupService userLookupService;

    @PostConstruct
    public void init() {
        System.out.println("ChatController initialized!");
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

    @GetMapping("/chat/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            @RequestParam("recipientId") String recipientId,
            @RequestParam("senderId") String senderId) {
        return ResponseEntity.ok(messageService.getUnreadCount(recipientId, senderId));
    }

    @PutMapping("/chat/read-conversation")
    public ResponseEntity<Void> markConversationAsRead(
            @RequestParam("recipientId") String recipientId,
            @RequestParam("senderId") String senderId) {
        messageService.markConversationAsRead(recipientId, senderId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/chat/edit/{id}")
    public ResponseEntity<Message> editMessage(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        String content = body.get("content");
        return ResponseEntity.ok(messageService.editMessage(id, content));
    }

    @GetMapping("/chat/last-message")
    public ResponseEntity<Message> getLastMessage(
            @RequestParam("user1") String user1,
            @RequestParam("user2") String user2) {
        System.out.println("Fetching last message between " + user1 + " and " + user2);
        Optional<Message> msg = messageService.getLastMessage(user1, user2);
        if (msg.isPresent()) {
            System.out.println("Found last message: " + msg.get().getContent());
            return ResponseEntity.ok(msg.get());
        } else {
            System.out.println("No message found between users.");
            return ResponseEntity.noContent().build();
        }
    }

    @GetMapping("/chat/summary/{userId}")
    public ResponseEntity<List<ChatSummaryDTO>> getChatSummary(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(messageService.getChatSummary(userId));
    }

    @PostMapping("/chat/react/{messageId}")
    public ResponseEntity<MessageReaction> reactToMessage(
            @PathVariable("messageId") Long messageId,
            @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        ReactionType type = ReactionType.valueOf(body.get("type"));
        return ResponseEntity.ok(messageService.addReaction(messageId, userId, type));
    }

    @DeleteMapping("/chat/delete/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable("id") Long id) {
        messageService.deleteMessage(id);
        return ResponseEntity.ok().build();
    }
}
