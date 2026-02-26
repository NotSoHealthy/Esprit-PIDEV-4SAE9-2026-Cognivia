package org.example.dpchat.services;
import org.example.dpchat.entities.Message;
import org.example.dpchat.entities.ReactionType;
import org.example.dpchat.dto.ChatSummaryDTO;
import java.util.List;
import java.util.Optional;

public interface MessageService {
    Message sendMessage(Message message);

    List<Message> getConversation(String user1, String user2);

    List<Message> getRecentMessages(String userId);

    List<String> getRecentContacts(String userId);

    void markAsRead(Long messageId);

    long getUnreadCount(String recipientId, String senderId);

    void markConversationAsRead(String recipientId, String senderId);

    java.util.Optional<Message> getLastMessage(String user1, String user2);

    org.example.dpchat.entities.MessageReaction addReaction(Long messageId, String userId,
            org.example.dpchat.entities.ReactionType type);

    Message editMessage(Long id, String content);

    List<ChatSummaryDTO> getChatSummary(String userId);

    void deleteMessage(Long id);
}
