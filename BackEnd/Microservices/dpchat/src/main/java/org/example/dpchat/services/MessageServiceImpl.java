package org.example.dpchat.services;

import lombok.RequiredArgsConstructor;
import org.example.dpchat.dto.ChatSummaryDTO;
import org.example.dpchat.entities.Message;
import org.example.dpchat.entities.MessageReaction;
import org.example.dpchat.entities.ReactionType;
import org.example.dpchat.entities.GroupConversation;
import org.example.dpchat.entities.GroupMember;
import org.example.dpchat.repositories.MessageReactionRepository;
import org.example.dpchat.repositories.MessageRepository;
import org.example.dpchat.repositories.GroupConversationRepository;
import org.example.dpchat.repositories.GroupMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final MessageReactionRepository reactionRepository;
    private final UserLookupService userLookupService;
    private final GroupConversationRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Override
    public Message sendMessage(Message message) {
        if (message.getSenderId() != null) {
            message.setSenderId(message.getSenderId().trim().toLowerCase());
        }
        if (message.getRecipientId() != null) {
            message.setRecipientId(message.getRecipientId().trim().toLowerCase());
        }
        message.setTimestamp(LocalDateTime.now());
        message.setRead(false);
        Message saved = messageRepository.save(message);
        populateUserInfo(saved);
        return saved;
    }

    @Override
    public List<Message> getConversation(String user1, String user2) {
        String u1 = (user1 != null) ? user1.trim().toLowerCase() : "";
        String u2 = (user2 != null) ? user2.trim().toLowerCase() : "";
        List<Message> messages = messageRepository.findConversation(u1, u2);
        messages.forEach(this::populateUserInfo);
        return messages;
    }

    @Override
    public List<Message> getRecentMessages(String userId) {
        String normalizedId = (userId != null) ? userId.trim().toLowerCase() : "";
        List<Message> messages = messageRepository.findByRecipientIdOrderByTimestampDesc(normalizedId);
        messages.forEach(this::populateUserInfo);
        return messages;
    }

    @Override
    public List<String> getRecentContacts(String userId) {
        String normalizedId = (userId != null) ? userId.trim().toLowerCase() : "";
        return messageRepository.findRecentContacts(normalizedId);
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
        String rId = (recipientId != null) ? recipientId.trim().toLowerCase() : "";
        String sId = (senderId != null) ? senderId.trim().toLowerCase() : "";
        return messageRepository.countByRecipientIdAndSenderIdAndReadFalse(rId, sId);
    }

    @Override
    public void markConversationAsRead(String recipientId, String senderId) {
        String rId = (recipientId != null) ? recipientId.trim().toLowerCase() : "";
        String sId = (senderId != null) ? senderId.trim().toLowerCase() : "";
        messageRepository.markConversationAsRead(rId, sId);
    }

    @Override
    public List<ChatSummaryDTO> getChatSummary(String userId) {
        String normalizedId = (userId != null) ? userId.trim().toLowerCase() : "";
        List<String> contacts = messageRepository.findRecentContacts(normalizedId);

        List<Object[]> counts = messageRepository.getUnreadCountsBySender(normalizedId);
        Map<String, Long> unreadMap = new HashMap<>();
        for (Object[] row : counts) {
            unreadMap.put((String) row[0], (Long) row[1]);
        }

        List<ChatSummaryDTO> summaries = contacts.stream().map(contactId -> {
            long unreadCount = unreadMap.getOrDefault(contactId, 0L);
            Optional<Message> lastMessage = messageRepository.findLastMessage(normalizedId, contactId);
            Message msg = lastMessage.orElse(null);
            if (msg != null)
                populateUserInfo(msg);
            return new ChatSummaryDTO(contactId, unreadCount, msg);
        }).collect(Collectors.toList());

        // Add group summaries
        List<GroupMember> userGroups = groupMemberRepository.findByUserId(normalizedId);
        for (GroupMember member : userGroups) {
            String contactId = "group-" + member.getGroupId();
            int unreadCount = messageRepository.countByGroupIdAndTimestampAfter(member.getGroupId(),
                    member.getLastReadTimestamp());
            Optional<Message> lastMessage = messageRepository.findTopByGroupIdOrderByTimestampDesc(member.getGroupId());
            Message msg = lastMessage.orElse(null);
            if (msg != null)
                populateUserInfo(msg);
            summaries.add(new ChatSummaryDTO(contactId, (long) unreadCount, msg));
        }

        return summaries;
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
        String u1 = (user1 != null) ? user1.trim().toLowerCase() : "";
        String u2 = (user2 != null) ? user2.trim().toLowerCase() : "";
        return messageRepository.findLastMessage(u1, u2);
    }

    @Override
    public MessageReaction addReaction(Long messageId, String userId, ReactionType type) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        return reactionRepository.findByMessageIdAndUserId(messageId, userId)
                .map(existing -> {
                    if (existing.getType() == type) {
                        reactionRepository.delete(existing);
                        message.getReactions().remove(existing);
                        return null;
                    } else {
                        existing.setType(type);
                        return reactionRepository.save(existing);
                    }
                })
                .orElseGet(() -> {
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

    @Override
    public GroupConversation createGroup(String name, String creatorId, List<String> memberIds) {
        GroupConversation group = new GroupConversation(name, creatorId);
        GroupConversation savedGroup = groupRepository.save(group);

        // Add members
        for (String userId : memberIds) {
            groupMemberRepository.save(new GroupMember(savedGroup.getId(), userId));
        }
        // Also add creator as member if not already in list
        if (!memberIds.contains(creatorId)) {
            groupMemberRepository.save(new GroupMember(savedGroup.getId(), creatorId));
        }

        return savedGroup;
    }

    @Override
    public List<GroupConversation> getUserGroups(String userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserId(userId.toLowerCase().trim());
        return memberships.stream()
                .map(m -> groupRepository.findById(m.getGroupId()).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    public List<Message> getGroupMessages(Long groupId) {
        List<Message> messages = messageRepository.findByGroupIdOrderByTimestampAsc(groupId);
        messages.forEach(this::populateUserInfo);
        return messages;
    }

    @Override
    public List<String> getGroupMemberIds(Long groupId) {
        return groupMemberRepository.findByGroupId(groupId).stream()
                .map(GroupMember::getUserId)
                .collect(Collectors.toList());
    }

    @Override
    public void addGroupMembers(Long groupId, List<String> userIds) {
        // Prevent duplicate user entries using findByGroupId and checking existing
        // users
        List<GroupMember> existingMembers = groupMemberRepository.findByGroupId(groupId);
        List<String> existingUserIds = existingMembers.stream()
                .map(GroupMember::getUserId)
                .collect(Collectors.toList());

        for (String userId : userIds) {
            if (!existingUserIds.contains(userId)) {
                groupMemberRepository.save(new GroupMember(groupId, userId));
            }
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @Override
    public void removeGroupMember(Long groupId, String userId) {
        groupMemberRepository.deleteByGroupIdAndUserId(groupId, userId);
    }

    @Override
    public void markGroupAsRead(Long groupId, String userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId).ifPresent(member -> {
            member.setLastReadTimestamp(java.time.LocalDateTime.now());
            groupMemberRepository.save(member);
        });
    }
}
