package org.example.dpchat.services;

import org.example.dpchat.entities.Message;
import org.example.dpchat.entities.UserRestriction;
import org.example.dpchat.services.UserLookupService;
import org.example.dpchat.repositories.MessageRepository;
import org.example.dpchat.repositories.UserRestrictionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MessageServiceImplTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserRestrictionRepository restrictionRepository;

    @Mock
    private UserLookupService userLookupService;

    @InjectMocks
    private MessageServiceImpl messageService;

    private Message testMessage;

    @BeforeEach
    void setUp() {
        testMessage = new Message();
        testMessage.setId(1L);
        testMessage.setSenderId("user1");
        testMessage.setRecipientId("user2");
        testMessage.setContent("Hello World");
        testMessage.setTimestamp(LocalDateTime.now());
        testMessage.setRead(false);
    }

    @Test
    void testSendMessage_Success() {
        when(restrictionRepository.findByUserId(anyString())).thenReturn(Optional.empty());
        when(messageRepository.save(any(Message.class))).thenReturn(testMessage);

        Message result = messageService.sendMessage(testMessage);

        assertNotNull(result);
        assertEquals("user1", result.getSenderId());
        verify(messageRepository, times(1)).save(any(Message.class));
    }

    @Test
    void testSendMessage_Restricted() {
        UserRestriction restriction = new UserRestriction();
        restriction.setUntil(LocalDateTime.now().plusDays(1)); // Active restriction

        when(restrictionRepository.findByUserId(anyString())).thenReturn(Optional.of(restriction));

        assertThrows(RuntimeException.class, () -> messageService.sendMessage(testMessage));
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    void testGetConversation_Success() {
        when(messageRepository.findConversation("user1", "user2"))
                .thenReturn(Collections.singletonList(testMessage));

        List<Message> results = messageService.getConversation("user1", "user2");

        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals("user1", results.get(0).getSenderId());
    }

    @Test
    void testMarkAsRead_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(testMessage));

        messageService.markAsRead(1L);

        assertTrue(testMessage.getRead());
        verify(messageRepository, times(1)).save(testMessage);
    }

    @Test
    void testGetUnreadCount() {
        when(messageRepository.countByRecipientIdAndSenderIdAndReadFalse("user2", "user1"))
                .thenReturn(5L);

        long count = messageService.getUnreadCount("user2", "user1");

        assertEquals(5L, count);
    }
}
