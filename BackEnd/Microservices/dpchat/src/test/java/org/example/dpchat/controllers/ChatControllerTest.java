package org.example.dpchat.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.dpchat.entities.*;
import org.example.dpchat.services.MessageService;
import org.example.dpchat.services.UserLookupService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChatController.class)
public class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MessageService messageService;

    @MockitoBean
    private UserLookupService userLookupService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testRootReachable() throws Exception {
        mockMvc.perform(get("/root-test"))
                .andExpect(status().isOk())
                .andExpect(content().string("Chat Service root is reachable!"));
    }

    @Test
    void testSendMessage() throws Exception {
        Message msg = new Message();
        msg.setContent("Test Message");
        msg.setSenderId("user1");
        msg.setRecipientId("user2");

        when(messageService.sendMessage(any(Message.class))).thenReturn(msg);

        mockMvc.perform(post("/chat/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(msg)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Test Message"));
    }

    @Test
    void testGetConversation() throws Exception {
        when(messageService.getConversation("user1", "user2"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/chat/conversation")
                        .param("user1", "user1")
                        .param("user2", "user2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetUnreadCount() throws Exception {
        when(messageService.getUnreadCount("user2", "user1")).thenReturn(5L);

        mockMvc.perform(get("/chat/unread-count")
                        .param("recipientId", "user2")
                        .param("senderId", "user1"))
                .andExpect(status().isOk())
                .andExpect(content().string("5"));
    }

    @Test
    void testCreateGroup() throws Exception {
        ChatController.CreateGroupRequest request = new ChatController.CreateGroupRequest();
        request.name = "Test Group";
        request.creatorId = "creator";
        request.memberIds = List.of("user1", "user2");

        GroupConversation group = new GroupConversation("Test Group", "creator");
        when(messageService.createGroup(anyString(), anyString(), anyList())).thenReturn(group);

        mockMvc.perform(post("/chat/group/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Group"));
    }

    @Test
    void testReactToMessage() throws Exception {
        Map<String, String> body = Map.of("userId", "user1", "type", "LIKE");
        MessageReaction reaction = new MessageReaction();
        reaction.setType(ReactionType.LIKE);

        when(messageService.addReaction(anyLong(), anyString(), any(ReactionType.class)))
                .thenReturn(reaction);

        mockMvc.perform(post("/chat/react/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("LIKE"));
    }

    @Test
    void testReportChat() throws Exception {
        ChatController.ReportRequest request = new ChatController.ReportRequest();
        request.reporterId = "reporter";
        request.reportedUserId = "reported";
        request.reason = "Spam";

        mockMvc.perform(post("/chat/report")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
