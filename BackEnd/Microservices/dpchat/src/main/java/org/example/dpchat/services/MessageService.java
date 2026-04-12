package org.example.dpchat.services;
import org.example.dpchat.entities.Message;
import org.example.dpchat.entities.ReactionType;
import org.example.dpchat.entities.GroupConversation;
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
    
    // Group Chat Methods
    GroupConversation createGroup(String name, String creatorId, List<String> memberIds);
    List<GroupConversation> getUserGroups(String userId);
    List<Message> getGroupMessages(Long groupId);
    List<org.example.dpchat.dto.GroupMemberInfoDTO> getGroupMembersInfo(Long groupId);
    void addGroupMembers(Long groupId, List<String> userIds);
    void removeGroupMember(Long groupId, String userId);
    void markGroupAsRead(Long groupId, String userId);
    void promoteToAdmin(Long groupId, String userId);
    void clearGroupHistory(Long groupId);
    void deleteGroup(Long groupId);

    // Admin & Reporting Methods
    void reportChat(String reporterId, String reportedUserId, Long groupId, Long messageId, String reason);
    List<org.example.dpchat.dto.ChatReportDTO> getAllReports();
    void resolveReport(Long reportId);
    List<Message> getConversationContext(String user1, String user2, Long groupId, Long messageId);
    void restrictUser(String userId, String type, Integer durationInHours, String reason);
    boolean isUserRestricted(String userId);
    Optional<org.example.dpchat.dto.UserRestrictionDTO> getUserRestriction(String userId);
}
