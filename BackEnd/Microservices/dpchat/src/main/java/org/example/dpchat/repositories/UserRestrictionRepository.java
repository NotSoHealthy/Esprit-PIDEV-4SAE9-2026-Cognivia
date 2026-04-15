package org.example.dpchat.repositories;

import org.example.dpchat.entities.UserRestriction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRestrictionRepository extends JpaRepository<UserRestriction, Long> {
    Optional<UserRestriction> findByUserId(String userId);
}
