package com.pidev.care.services;

import com.pidev.care.entities.TaskSubmission;
import java.util.List;

public interface TaskSubmissionService {
    TaskSubmission create(TaskSubmission submission);
    TaskSubmission getById(Long id);
    List<TaskSubmission> getByTaskId(Long taskId);
    List<TaskSubmission> getByPatientId(Long patientId);
    TaskSubmission validate(Long id, String validationStatus, String comments, String validatedBy);
    TaskSubmission update(Long id, TaskSubmission submission);
    void delete(Long id);
}
