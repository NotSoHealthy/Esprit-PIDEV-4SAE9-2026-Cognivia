package org.example.dpchat.services;

import org.example.dpchat.entities.Message;
import org.example.dpchat.repositories.MessageRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserLookupService userLookupService;

    public MessageServiceImpl(MessageRepository messageRepository, UserLookupService userLookupService) {
        this.messageRepository = messageRepository;
        this.userLookupService = userLookupService;
    }

    @Override
    public Message sendMessage(Message message) {
        message.setTimestamp(LocalDateTime.now());
        message.setRead(false);
        Message saved = messageRepository.save(message);
        populateUserInfo(saved);
        return saved;
    }

    @Override
    public List<Message> getConversation(String user1, String user2) {
        List<Message> messages = messageRepository.findConversation(user1, user2);
        messages.forEach(this::populateUserInfo);
        return messages;
    }

    @Override
    public List<Message> getRecentMessages(String userId) {
        List<Message> messages = messageRepository.findByRecipientIdOrderByTimestampDesc(userId);
        messages.forEach(this::populateUserInfo);
        return messages;
    }

    @Override
    public List<String> getRecentContacts(String userId) {
        return messageRepository.findRecentContacts(userId);
    }

    @Override
    public void markAsRead(Long messageId) {
        messageRepository.findById(messageId).ifPresent(m -> {
            m.setRead(true);
            messageRepository.save(m);
        });
    }

    private void populateUserInfo(Message message) {
        userLookupService.lookupUser(message.getSenderId()).ifPresent(profile -> {
            message.setSenderName(profile.name);
            message.setSenderRole(profile.role);
        });
    }
}
