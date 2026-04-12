package org.example.dpchat.repositories;

import org.example.dpchat.entities.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByRecipientIdOrderByTimestampDesc(String recipientId);

    List<Message> findByGroupIdOrderByTimestampAsc(Long groupId);

    @EntityGraph(attributePaths = { "reactions" })
    @Query("SELECT m FROM Message m WHERE (m.senderId = :user1 AND m.recipientId = :user2) OR (m.senderId = :user2 AND m.recipientId = :user1) ORDER BY m.timestamp ASC")
    List<Message> findConversation(String user1, String user2);

    @Query("SELECT DISTINCT CASE WHEN m.senderId = :userId THEN m.recipientId ELSE m.senderId END FROM Message m WHERE m.senderId = :userId OR m.recipientId = :userId")
    List<String> findRecentContacts(@Param("userId") String userId);

    @Query(value = "SELECT * FROM message WHERE (sender_id = :u1 AND recipient_id = :u2) OR (sender_id = :u2 AND recipient_id = :u1) ORDER BY timestamp DESC LIMIT 1", nativeQuery = true)
    Optional<Message> findLastMessage(@Param("u1") String u1, @Param("u2") String u2);

    long countByRecipientIdAndSenderIdAndReadFalse(String recipientId, String senderId);

    @Query("SELECT m.senderId, COUNT(m) FROM Message m WHERE m.recipientId = :recipientId AND m.read = false GROUP BY m.senderId")
    List<Object[]> getUnreadCountsBySender(@Param("recipientId") String recipientId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.read = true WHERE m.recipientId = :recipientId AND m.senderId = :senderId AND m.read = false")
    void markConversationAsRead(@Param("recipientId") String recipientId, @Param("senderId") String senderId);

    int countByGroupIdAndTimestampAfter(Long groupId, java.time.LocalDateTime timestamp);

    java.util.Optional<Message> findTopByGroupIdOrderByTimestampDesc(Long groupId);

    @Modifying
    @Transactional
    void deleteByGroupId(Long groupId);

    // Surrounding context queries for reports
    @Query(value = "SELECT * FROM message WHERE ((sender_id = :u1 AND recipient_id = :u2) OR (sender_id = :u2 AND recipient_id = :u1)) AND timestamp < :timestamp ORDER BY timestamp DESC LIMIT :limit", nativeQuery = true)
    List<Message> findPrivateBefore(@Param("u1") String u1, @Param("u2") String u2, @Param("timestamp") java.time.LocalDateTime timestamp, @Param("limit") int limit);

    @Query(value = "SELECT * FROM message WHERE ((sender_id = :u1 AND recipient_id = :u2) OR (sender_id = :u2 AND recipient_id = :u1)) AND timestamp > :timestamp ORDER BY timestamp ASC LIMIT :limit", nativeQuery = true)
    List<Message> findPrivateAfter(@Param("u1") String u1, @Param("u2") String u2, @Param("timestamp") java.time.LocalDateTime timestamp, @Param("limit") int limit);

    @Query(value = "SELECT * FROM message WHERE group_id = :groupId AND timestamp < :timestamp ORDER BY timestamp DESC LIMIT :limit", nativeQuery = true)
    List<Message> findGroupBefore(@Param("groupId") Long groupId, @Param("timestamp") java.time.LocalDateTime timestamp, @Param("limit") int limit);

    @Query(value = "SELECT * FROM message WHERE group_id = :groupId AND timestamp > :timestamp ORDER BY timestamp ASC LIMIT :limit", nativeQuery = true)
    List<Message> findGroupAfter(@Param("groupId") Long groupId, @Param("timestamp") java.time.LocalDateTime timestamp, @Param("limit") int limit);
}
