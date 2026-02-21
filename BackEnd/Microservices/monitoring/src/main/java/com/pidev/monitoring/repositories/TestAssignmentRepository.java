package com.pidev.monitoring.repositories;

import com.pidev.monitoring.entities.AssignmentType;
import com.pidev.monitoring.entities.SeverityTarget;
import com.pidev.monitoring.entities.TestAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestAssignmentRepository extends JpaRepository<TestAssignment, Long> {

    /** All assignments directly targeting a specific patient */
    List<TestAssignment> findByPatientId(Long patientId);

    /** All general assignments matching a given severity group */
    List<TestAssignment> findByAssignmentTypeAndTargetSeverity(
            AssignmentType assignmentType,
            SeverityTarget targetSeverity);
}
