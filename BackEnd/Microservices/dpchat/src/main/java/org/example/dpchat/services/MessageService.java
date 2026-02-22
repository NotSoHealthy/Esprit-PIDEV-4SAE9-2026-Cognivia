package org.example.dpchat.services;

import org.example.dpchat.entities.Message;
import java.util.List;

public interface MessageService {
    Message sendMessage(Message message);

    List<Message> getConversation(String user1, String user2);

    List<Message> getRecentMessages(String userId);

    List<String> getRecentContacts(String userId);

    void markAsRead(Long messageId);
}
