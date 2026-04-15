package org.example.dpchat.services;

import org.example.dpchat.entities.*;
import org.example.dpchat.repositories.*;
import org.example.dpchat.services.EventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Mock
    private GroupConversationRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private ChatReportRepository reportRepository;

    @Mock
    private MessageReactionRepository reactionRepository;

    @Mock
    private AIService aiService;

    @Mock
    private EventPublisher eventPublisher;

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

    @Test
    void testCreateGroup_Success() {
        GroupConversation group = new GroupConversation("Test Group", "creator");
        group.setId(10L);
        when(groupRepository.save(any(GroupConversation.class))).thenReturn(group);

        GroupConversation result = messageService.createGroup("Test Group", "creator", List.of("user1", "user2"));

        assertNotNull(result);
        assertEquals("Test Group", result.getName());
        verify(groupRepository).save(any(GroupConversation.class));
        verify(groupMemberRepository, atLeast(2)).save(any(GroupMember.class));
    }

    @Test
    void testAddReaction_NewReaction() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(testMessage));
        when(reactionRepository.findByMessageIdAndUserId(1L, "user1")).thenReturn(Optional.empty());
        when(reactionRepository.save(any(MessageReaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MessageReaction result = messageService.addReaction(1L, "user1", ReactionType.LIKE);

        assertNotNull(result);
        assertEquals(ReactionType.LIKE, result.getType());
        verify(reactionRepository).save(any(MessageReaction.class));
    }

    @Test
    void testAddReaction_ToggleOff() {
        MessageReaction reaction = new MessageReaction();
        reaction.setType(ReactionType.LIKE);
        testMessage.getReactions().add(reaction);

        when(messageRepository.findById(1L)).thenReturn(Optional.of(testMessage));
        when(reactionRepository.findByMessageIdAndUserId(1L, "user1")).thenReturn(Optional.of(reaction));

        MessageReaction result = messageService.addReaction(1L, "user1", ReactionType.LIKE);

        assertNull(result);
        verify(reactionRepository).delete(reaction);
    }

    @Test
    void testEditMessage_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(testMessage));
        when(messageRepository.save(any(Message.class))).thenReturn(testMessage);

        Message result = messageService.editMessage(1L, "Updated Content");

        assertEquals("Updated Content", result.getContent());
        assertTrue(result.getEdited());
    }

    @Test
    void testDeleteMessage_Success() {
        when(messageRepository.findById(1L)).thenReturn(Optional.of(testMessage));

        messageService.deleteMessage(1L);

        assertTrue(testMessage.getDeleted());
        assertEquals("This message has been deleted", testMessage.getContent());
        verify(messageRepository).save(testMessage);
    }

    @Test
    void testReportChat_Success() {
        messageService.reportChat("reporter", "reported", 10L, 1L, "Inappropriate");

        verify(reportRepository).save(any(ChatReport.class));
    }

    @Test
    void testRestrictUser_Success() {
        when(restrictionRepository.findByUserId("user1")).thenReturn(Optional.empty());

        messageService.restrictUser("user1", "BAN", 24, "Toxic");

        verify(restrictionRepository).save(any(UserRestriction.class));
    }

    @Test
    void testIsUserRestricted_True() {
        UserRestriction restriction = new UserRestriction();
        restriction.setUntil(LocalDateTime.now().plusHours(1));

        when(restrictionRepository.findByUserId("user1")).thenReturn(Optional.of(restriction));

        assertTrue(messageService.isUserRestricted("user1"));
    }
}
