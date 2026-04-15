package org.example.dpchat.repositories;
import org.example.dpchat.entities.GroupConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupConversationRepository extends JpaRepository<GroupConversation, Long> {
}
