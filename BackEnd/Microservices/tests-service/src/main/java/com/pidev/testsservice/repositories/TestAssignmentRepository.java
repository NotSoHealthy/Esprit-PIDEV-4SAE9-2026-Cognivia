package com.pidev.testsservice.repositories;

import com.pidev.testsservice.entities.TestAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestAssignmentRepository extends JpaRepository<TestAssignment, Long> {
}
