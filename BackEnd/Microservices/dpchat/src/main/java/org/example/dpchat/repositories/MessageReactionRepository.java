package org.example.dpchat.repositories;

import org.example.dpchat.entities.MessageReaction;
import org.example.dpchat.entities.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    Optional<MessageReaction> findByMessageIdAndUserId(Long messageId, String userId);
}
