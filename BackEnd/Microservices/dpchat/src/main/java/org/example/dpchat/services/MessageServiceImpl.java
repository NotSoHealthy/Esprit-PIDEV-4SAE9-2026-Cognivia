package org.example.dpchat.services;

import org.example.dpchat.entities.Message;
import org.example.dpchat.entities.MessageReaction;
import org.example.dpchat.entities.ReactionType;
import org.example.dpchat.repositories.MessageRepository;
import org.example.dpchat.repositories.MessageReactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final MessageReactionRepository reactionRepository;
    private final UserLookupService userLookupService;

    public MessageServiceImpl(MessageRepository messageRepository,
            MessageReactionRepository reactionRepository,
            UserLookupService userLookupService) {
        this.messageRepository = messageRepository;
        this.reactionRepository = reactionRepository;
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

    @Override
    public long getUnreadCount(String recipientId, String senderId) {
        return messageRepository.countByRecipientIdAndSenderIdAndReadFalse(recipientId, senderId);
    }

    @Override
    public void markConversationAsRead(String recipientId, String senderId) {
        messageRepository.markConversationAsRead(recipientId, senderId);
    }

    @Override
    public Message editMessage(Long id, String content) {
        return messageRepository.findById(id).map(m -> {
            m.setContent(content);
            m.setEdited(true);
            return messageRepository.save(m);
        }).orElseThrow(() -> new RuntimeException("Message not found"));
    }

    @Override
    public void deleteMessage(Long id) {
        messageRepository.findById(id).ifPresent(m -> {
            m.setContent("This message has been deleted");
            m.setDeleted(true);
            messageRepository.save(m);
        });
    }

    @Override
    public Optional<Message> getLastMessage(String user1, String user2) {
        return messageRepository.findLastMessage(user1, user2);
    }

    @Override
    public MessageReaction addReaction(Long messageId, String userId, ReactionType type) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        return reactionRepository.findByMessageIdAndUserId(messageId, userId)
                .map(existing -> {
                    if (existing.getType() == type) {
                        // Toggle off
                        reactionRepository.delete(existing);
                        message.getReactions().remove(existing);
                        return null; // Return null to indicate removal
                    } else {
                        // Update type
                        existing.setType(type);
                        return reactionRepository.save(existing);
                    }
                })
                .orElseGet(() -> {
                    // New reaction
                    MessageReaction reaction = new MessageReaction();
                    reaction.setMessage(message);
                    reaction.setUserId(userId);
                    reaction.setType(type);
                    MessageReaction saved = reactionRepository.save(reaction);
                    message.getReactions().add(saved);
                    return saved;
                });
    }

    private void populateUserInfo(Message message) {
        if (message.getSenderId() == null)
            return;
        userLookupService.lookupUser(message.getSenderId()).ifPresent(profile -> {
            message.setSenderName(profile.name);
            message.setSenderRole(profile.role);
        });
    }
}
