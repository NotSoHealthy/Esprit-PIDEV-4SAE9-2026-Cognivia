package org.example.dpchat.repositories;

import org.example.dpchat.entities.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByRecipientIdOrderByTimestampDesc(String recipientId);

    @Query("SELECT m FROM Message m WHERE (m.senderId = :user1 AND m.recipientId = :user2) OR (m.senderId = :user2 AND m.recipientId = :user1) ORDER BY m.timestamp ASC")
    List<Message> findConversation(String user1, String user2);

    @Query("SELECT DISTINCT CASE WHEN m.senderId = :userId THEN m.recipientId ELSE m.senderId END FROM Message m WHERE m.senderId = :userId OR m.recipientId = :userId")
    List<String> findRecentContacts(String userId);
}
