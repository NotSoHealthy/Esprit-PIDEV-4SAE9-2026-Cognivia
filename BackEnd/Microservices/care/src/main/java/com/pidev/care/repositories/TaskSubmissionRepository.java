package com.pidev.care.repositories;

import com.pidev.care.entities.TaskSubmission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskSubmissionRepository extends JpaRepository<TaskSubmission, Long> {
    List<TaskSubmission> findByTaskId(Long taskId);
    List<TaskSubmission> findByPatientId(Long patientId);
    List<TaskSubmission> findByTaskIdAndPatientId(Long taskId, Long patientId);
    List<TaskSubmission> findByValidationStatus(String validationStatus);
}
