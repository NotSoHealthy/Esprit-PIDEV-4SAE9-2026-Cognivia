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
import org.example.dpchat.entities.ChatReport;
import org.example.dpchat.entities.UserRestriction;
import org.example.dpchat.repositories.ChatReportRepository;
import org.example.dpchat.repositories.UserRestrictionRepository;
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
    private final ChatReportRepository reportRepository;
    private final UserRestrictionRepository restrictionRepository;
    private final AIService aiService;
    private final EventPublisher eventPublisher;

    @Override
    public Message sendMessage(Message message) {
        if (isUserRestricted(message.getSenderId())) {
            throw new RuntimeException("You are restricted from sending messages.");
        }
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
        eventPublisher.publishChatEvent(saved);
        return saved;
    }

    @Override
    public List<Message> getConversation(String user1, String user2) {
        String u1 = (user1 != null) ? user1.trim().toLowerCase() : "";
        String u2 = (user2 != null) ? user2.trim().toLowerCase() : "";
        List<Message> messages = messageRepository.findConversation(u1, u2);
        messages.forEach(m -> {
            populateUserInfo(m);
            if (m.getRead() != null && m.getRead()) {
                // If the sender is u1, u2 has read it. If sender is u2, u1 has read it.
                // We add the RECIPIENT to the seenBy list.
                String recipientId = m.getSenderId().equals(u1) ? u2 : u1;
                m.getSeenBy().add(recipientId);
            }
        });
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
        
        // 1. Fetch unread counts for private messages
        List<Object[]> counts = messageRepository.getUnreadCountsBySender(normalizedId);
        Map<String, Long> unreadMap = new HashMap<>();
        for (Object[] row : counts) {
            if (row[0] != null && row[1] != null) {
                // Safely convert to long regardless of whether DB returns Integer, BigInteger, or Long
                unreadMap.put(((String) row[0]).toLowerCase(), ((Number) row[1]).longValue());
            }
        }

        // 2. Fetch last messages for all private contacts in one query
        List<Message> lastPrivateMessages = messageRepository.findLastMessagesForAllContacts(normalizedId);
        Map<String, Message> lastMsgMap = new HashMap<>();
        for (Message m : lastPrivateMessages) {
            String sId = m.getSenderId() != null ? m.getSenderId().toLowerCase() : "";
            String rId = m.getRecipientId() != null ? m.getRecipientId().toLowerCase() : "";
            String contactId = sId.equals(normalizedId) ? rId : sId;
            if (!contactId.isEmpty()) {
                lastMsgMap.put(contactId, m);
            }
        }

        // 3. Assemble private chat summaries
        List<ChatSummaryDTO> summaries = lastMsgMap.entrySet().stream().map(entry -> {
            String contactId = entry.getKey();
            Message msg = entry.getValue();
            populateUserInfo(msg);
            long unreadCount = unreadMap.getOrDefault(contactId, 0L);
            return new ChatSummaryDTO(contactId, unreadCount, msg);
        }).collect(Collectors.toList());

        // 4. Fetch group summaries
        List<GroupMember> userGroups = groupMemberRepository.findByUserId(normalizedId);
        List<Message> lastGroupMessages = messageRepository.findLastMessagesForUserGroups(normalizedId);
        
        // Use three-argument toMap to safely handle any potential duplicates
        Map<Long, Message> lastGroupMsgMap = lastGroupMessages.stream()
                .filter(m -> m.getGroupId() != null)
                .collect(Collectors.toMap(
                    Message::getGroupId, 
                    m -> m, 
                    (existing, replacement) -> existing
                ));

        for (GroupMember member : userGroups) {
            String contactId = "group-" + member.getGroupId();
            int unreadCount = messageRepository.countByGroupIdAndTimestampAfter(member.getGroupId(),
                    member.getLastReadTimestamp());
            Message msg = lastGroupMsgMap.get(member.getGroupId());
            if (msg != null)
                populateUserInfo(msg);
            summaries.add(new ChatSummaryDTO(contactId, (long) unreadCount, msg));
        }

        // Sort by last message timestamp desc (NPE safe)
        summaries.sort((a, b) -> {
            LocalDateTime aTs = (a.getLastMessage() != null && a.getLastMessage().getTimestamp() != null) 
                                ? a.getLastMessage().getTimestamp() : LocalDateTime.MIN;
            LocalDateTime bTs = (b.getLastMessage() != null && b.getLastMessage().getTimestamp() != null) 
                                ? b.getLastMessage().getTimestamp() : LocalDateTime.MIN;
            return bTs.compareTo(aTs);
        });

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
        try {
            userLookupService.lookupUser(message.getSenderId()).ifPresent(profile -> {
                message.setSenderName(profile.name);
                message.setSenderRole(profile.role);
            });
        } catch (Exception e) {
            // Log and allow summary generation to continue even if one user lookup fails
            System.err.println("Error populating user info for summary: " + e.getMessage());
        }
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
        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        
        messages.forEach(m -> {
            populateUserInfo(m);
            for (GroupMember member : members) {
                // Ignore sender
                if (member.getUserId().equalsIgnoreCase(m.getSenderId())) continue;
                
                // If user read time is after message timestamp
                if (member.getLastReadTimestamp() != null && 
                    !member.getLastReadTimestamp().isBefore(m.getTimestamp())) {
                    m.getSeenBy().add(member.getUserId());
                }
            }
        });
        return messages;
    }

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

    @Override
    public List<org.example.dpchat.dto.GroupMemberInfoDTO> getGroupMembersInfo(Long groupId) {
        return groupMemberRepository.findByGroupId(groupId).stream()
                .map(m -> new org.example.dpchat.dto.GroupMemberInfoDTO(m.getUserId(), m.isAdmin()))
                .collect(Collectors.toList());
    }

    @Override
    public void promoteToAdmin(Long groupId, String userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId).ifPresent(member -> {
            member.setAdmin(true);
            groupMemberRepository.save(member);
        });
    }

    @Override
    public void clearGroupHistory(Long groupId) {
        messageRepository.deleteByGroupId(groupId);
    }

    @Override
    public void deleteGroup(Long groupId) {
        messageRepository.deleteByGroupId(groupId);
        groupMemberRepository.deleteByGroupId(groupId);
        groupRepository.deleteById(groupId);
    }

    @Override
    public void reportChat(String reporterId, String reportedUserId, Long groupId, Long messageId, String reason) {
        ChatReport report = new ChatReport();
        report.setReporterId(reporterId);
        report.setReportedUserId(reportedUserId);
        report.setGroupId(groupId);
        report.setMessageId(messageId);
        report.setReason(reason);
        reportRepository.save(report);
    }

    @Override
    public List<org.example.dpchat.dto.ChatReportDTO> getAllReports() {
        return reportRepository.findAll().stream().map(report -> {
            org.example.dpchat.dto.ChatReportDTO dto = org.example.dpchat.dto.ChatReportDTO.builder()
                    .id(report.getId())
                    .reporterId(report.getReporterId())
                    .reportedUserId(report.getReportedUserId())
                    .groupId(report.getGroupId())
                    .messageId(report.getMessageId())
                    .reason(report.getReason())
                    .timestamp(report.getTimestamp())
                    .status(report.getStatus())
                    .build();

            // Populate Names
            if (report.getReporterId() != null) {
                userLookupService.lookupUser(report.getReporterId())
                        .ifPresent(p -> dto.setReporterName(p.name));
            }
            if (report.getReportedUserId() != null) {
                userLookupService.lookupUser(report.getReportedUserId())
                        .ifPresent(p -> dto.setReportedUserName(p.name));
            }
            if (report.getGroupId() != null) {
                groupRepository.findById(report.getGroupId())
                        .ifPresent(g -> dto.setGroupName(g.getName()));
            }

            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public void resolveReport(Long reportId) {
        reportRepository.findById(reportId).ifPresent(report -> {
            report.setStatus("RESOLVED");
            reportRepository.save(report);
        });
    }

    @Override
    public List<Message> getConversationContext(String user1, String user2, Long groupId, Long messageId) {
        if (messageId != null) {
            Optional<Message> reportedOpt = messageRepository.findById(messageId);
            if (reportedOpt.isPresent()) {
                Message reported = reportedOpt.get();
                List<Message> before;
                List<Message> after;
                
                if (groupId != null) {
                    before = messageRepository.findGroupBefore(groupId, reported.getTimestamp(), 10);
                    after = messageRepository.findGroupAfter(groupId, reported.getTimestamp(), 5);
                } else {
                    before = messageRepository.findPrivateBefore(user1, user2, reported.getTimestamp(), 10);
                    after = messageRepository.findPrivateAfter(user1, user2, reported.getTimestamp(), 5);
                }
                
                Collections.reverse(before);
                List<Message> combined = new ArrayList<>(before);
                combined.add(reported);
                combined.addAll(after);
                
                combined.forEach(this::populateUserInfo);
                return combined;
            }
        }
        
        // Fallback to full history
        if (groupId != null) {
            return getGroupMessages(groupId);
        } else {
            return getConversation(user1, user2);
        }
    }

    @Override
    public void restrictUser(String userId, String type, Integer durationInHours, String reason) {
        UserRestriction restriction = restrictionRepository.findByUserId(userId)
                .orElse(new UserRestriction());
        
        restriction.setUserId(userId);
        restriction.setType(type);
        restriction.setReason(reason);
        
        if (durationInHours != null && durationInHours > 0) {
            restriction.setUntil(LocalDateTime.now().plusHours(durationInHours));
        } else {
            restriction.setUntil(null); // Permanent BAN
        }
        
        restrictionRepository.save(restriction);
    }

    @Override
    public boolean isUserRestricted(String userId) {
        return restrictionRepository.findByUserId(userId)
                .map(UserRestriction::isActive)
                .orElse(false);
    }

    @Override
    public Optional<org.example.dpchat.dto.UserRestrictionDTO> getUserRestriction(String userId) {
        return restrictionRepository.findByUserId(userId)
                .filter(UserRestriction::isActive)
                .map(res -> org.example.dpchat.dto.UserRestrictionDTO.builder()
                        .type(res.getType())
                        .reason(res.getReason())
                        .until(res.getUntil())
                        .build());
    }

    @Override
    public String getSummary(String user1, String user2, Long groupId) {
        List<Message> lastMessages;
        if (groupId != null) {
            lastMessages = messageRepository.findLastGroupMessages(groupId, 10);
        } else {
            lastMessages = messageRepository.findLastPrivateMessages(user1, user2, 10);
        }

        if (lastMessages.isEmpty()) {
            return "No messages to summarize.";
        }

        // Reverse to get chronological order (since we fetched DESC limit 10)
        Collections.reverse(lastMessages);

        StringBuilder sb = new StringBuilder();
        for (Message m : lastMessages) {
            if (Boolean.TRUE.equals(m.getDeleted())) continue;
            populateUserInfo(m);
            String name = (m.getSenderName() != null) ? m.getSenderName() : m.getSenderId();
            sb.append(name).append(": ").append(m.getContent()).append("\n");
        }

        return aiService.generateSummary(sb.toString());
    }
}
