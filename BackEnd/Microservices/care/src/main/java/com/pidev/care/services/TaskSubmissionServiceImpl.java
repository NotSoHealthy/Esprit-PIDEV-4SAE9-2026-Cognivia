package com.pidev.care.services;

import com.pidev.care.entities.TaskSubmission;
import com.pidev.care.repositories.TaskSubmissionRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskSubmissionServiceImpl implements TaskSubmissionService {
    
    @Autowired
    private TaskSubmissionRepository repository;

    @Override
    public TaskSubmission create(TaskSubmission submission) {
        if (submission.getTaskId() == null || submission.getPatientId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task ID and Patient ID are required");
        }
        if (submission.getDescription() == null || submission.getDescription().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }
        submission.setValidationStatus("pending");
        submission.setSubmittedAt(LocalDateTime.now());
        return repository.save(submission);
    }

    @Override
    public TaskSubmission getById(Long id) {
        return repository.findById(id).orElseThrow(() -> 
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found")
        );
    }

    @Override
    public List<TaskSubmission> getByTaskId(Long taskId) {
        return repository.findByTaskId(taskId);
    }

    @Override
    public List<TaskSubmission> getByPatientId(Long patientId) {
        return repository.findByPatientId(patientId);
    }

    @Override
    public TaskSubmission validate(Long id, String validationStatus, String comments, String validatedBy) {
        if (!validationStatus.equals("approved") && !validationStatus.equals("rejected")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid validation status");
        }
        
        TaskSubmission submission = getById(id);
        submission.setValidationStatus(validationStatus);
        submission.setValidationComments(comments);
        submission.setValidatedBy(validatedBy);
        submission.setValidatedAt(LocalDateTime.now());
        
        return repository.save(submission);
    }

    @Override
    public TaskSubmission update(Long id, TaskSubmission submission) {
        TaskSubmission existing = getById(id);
        if (submission.getDescription() != null) {
            existing.setDescription(submission.getDescription());
        }
        if (submission.getPictureData() != null) {
            existing.setPictureData(submission.getPictureData());
        }
        return repository.save(existing);
    }

    @Override
    public void delete(Long id) {
        TaskSubmission submission = getById(id);
        repository.delete(submission);
    }
}
