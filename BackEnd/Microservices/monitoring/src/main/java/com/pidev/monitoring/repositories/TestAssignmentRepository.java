package com.pidev.monitoring.repositories;

import com.pidev.monitoring.entities.TestAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestAssignmentRepository extends JpaRepository<TestAssignment, Long> {
}
