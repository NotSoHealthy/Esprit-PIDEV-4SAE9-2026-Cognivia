package org.example.dpchat.controllers;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.example.dpchat.dto.ChatSummaryDTO;
import org.example.dpchat.entities.Message;
import org.example.dpchat.entities.MessageReaction;
import org.example.dpchat.entities.ReactionType;
import org.example.dpchat.entities.GroupConversation;
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

    // Group Chat Endpoints
    @PostMapping("/chat/group/create")
    public ResponseEntity<GroupConversation> createGroup(@RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(messageService.createGroup(request.name, request.creatorId, request.memberIds));
    }

    @GetMapping("/chat/group/user/{userId}")
    public ResponseEntity<List<GroupConversation>> getUserGroups(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(messageService.getUserGroups(userId));
    }

    @GetMapping("/chat/group/{groupId}/messages")
    public ResponseEntity<List<Message>> getGroupMessages(@PathVariable("groupId") Long groupId) {
        return ResponseEntity.ok(messageService.getGroupMessages(groupId));
    }

    @GetMapping("/chat/group/{groupId}/members")
    public ResponseEntity<List<org.example.dpchat.dto.GroupMemberInfoDTO>> getGroupMembers(@PathVariable("groupId") Long groupId) {
        return ResponseEntity.ok(messageService.getGroupMembersInfo(groupId));
    }

    @PostMapping("/chat/group/{groupId}/members")
    public ResponseEntity<Void> addGroupMembers(@PathVariable("groupId") Long groupId, @RequestBody List<String> userIds) {
        messageService.addGroupMembers(groupId, userIds);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/chat/group/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeGroupMember(@PathVariable("groupId") Long groupId, @PathVariable("userId") String userId) {
        messageService.removeGroupMember(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/chat/group/{groupId}/read/{userId}")
    public ResponseEntity<Void> markGroupAsRead(@PathVariable("groupId") Long groupId, @PathVariable("userId") String userId) {
        messageService.markGroupAsRead(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/chat/group/{groupId}/promote/{userId}")
    public ResponseEntity<Void> promoteToAdmin(@PathVariable("groupId") Long groupId, @PathVariable("userId") String userId) {
        messageService.promoteToAdmin(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/chat/group/{groupId}/history")
    public ResponseEntity<Void> clearGroupHistory(@PathVariable("groupId") Long groupId) {
        messageService.clearGroupHistory(groupId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/chat/group/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable("groupId") Long groupId) {
        messageService.deleteGroup(groupId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/chat/report")
    public ResponseEntity<Void> reportChat(@RequestBody ReportRequest request) {
        messageService.reportChat(request.reporterId, request.reportedUserId, request.groupId, request.messageId, request.reason);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/chat/restriction/{userId}")
    public ResponseEntity<org.example.dpchat.dto.UserRestrictionDTO> getUserRestriction(@PathVariable("userId") String userId) {
        return messageService.getUserRestriction(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/chat/ai/summary/{convId}")
    public ResponseEntity<String> getSummary(
            @PathVariable("convId") String convId,
            @RequestParam(value = "userId", required = false) String userId) {
        
        if (convId.startsWith("group-")) {
            Long groupId = Long.parseLong(convId.replace("group-", ""));
            return ResponseEntity.ok(messageService.getSummary(null, null, groupId));
        } else {
            // convId is user1_user2
            String[] users = convId.split("_");
            if (users.length == 2) {
                return ResponseEntity.ok(messageService.getSummary(users[0], users[1], null));
            }
        }
        return ResponseEntity.badRequest().build();
    }

    public static class ReportRequest {
        public String reporterId;
        public String reportedUserId;
        public Long groupId;
        public Long messageId;
        public String reason;
    }

    public static class CreateGroupRequest {
        public String name;
        public String creatorId;
        public List<String> memberIds;
    }
}
