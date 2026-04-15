package com.pidev.care.services;

import com.pidev.care.dto.TaskHistoryEventDTO;
import com.pidev.care.entities.Task;
import com.pidev.care.entities.TaskSubmission;
import com.pidev.care.repositories.TaskRepository;
import com.pidev.care.repositories.TaskSubmissionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskSubmissionRepository submissionRepository;

    public TaskServiceImpl(TaskRepository taskRepository, TaskSubmissionRepository submissionRepository) {
        this.taskRepository = taskRepository;
        this.submissionRepository = submissionRepository;
    }

    @Override
    public Task create(Task task) {
        System.out.println("Backend: Creating task: " + task);
        System.out.println("Backend: patientId: " + task.getPatientId());
        System.out.println("Backend: userId: " + task.getUserId());
        System.out.println("Backend: taskType: " + task.getTaskType());
        System.out.println("Backend: dueAt: " + task.getDueAt());
        System.out.println("Backend: createdAt: " + task.getCreatedAt());

        if (task.getPatientId() == null)
            throw new IllegalArgumentException("patientId is required");
        if (task.getUserId() == null)
            throw new IllegalArgumentException("userId is required");
        if (task.getTask() == null || task.getTask().isBlank())
            throw new IllegalArgumentException("task is required");
        if (task.getTaskType() == null)
            throw new IllegalArgumentException("taskType is required");
        if (task.getDueAt() == null)
            throw new IllegalArgumentException("dueAt is required");

        // âœ… default false
        task.setIsDone(false);
        if (task.getCreatedAt() == null) {
            task.setCreatedAt(java.time.LocalDateTime.now());
        }

        return taskRepository.save(task);
    }

    @Override
    public Task getById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
    }

    @Override
    public List<Task> getAll() {
        return taskRepository.findAll();
    }

    @Override
    public List<Task> getByPatient(Long patientId) {
        return taskRepository.findByPatientId(patientId);
    }

    @Override
    public List<Task> getByUser(Long userId) {
        return taskRepository.findByUserId(userId);
    }

    @Override
    public Task update(Long id, Task newData) {
        Task existing = getById(id);

        if (newData.getPatientId() != null)
            existing.setPatientId(newData.getPatientId());
        if (newData.getUserId() != null)
            existing.setUserId(newData.getUserId());

        if (newData.getTask() != null && !newData.getTask().isBlank())
            existing.setTask(newData.getTask());

        if (newData.getTaskType() != null)
            existing.setTaskType(newData.getTaskType());

        if (newData.getDueAt() != null)
            existing.setDueAt(newData.getDueAt());

        return taskRepository.save(existing);
    }

    @Override
    public Task markDone(Long id, boolean isDone) {
        Task existing = getById(id);
        existing.setIsDone(isDone);
        return taskRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        Task existing = getById(id);
        taskRepository.delete(existing);
    }

    @Override
    public List<TaskHistoryEventDTO> getTaskHistory(Long taskId) {
        Task task = getById(taskId);
        LocalDateTime now = LocalDateTime.now();
        List<TaskHistoryEventDTO> events = new ArrayList<>();

        // ── 1. Task Created ──────────────────────────────────────────────────
        if (task.getCreatedAt() != null) {
            events.add(new TaskHistoryEventDTO(
                "TASK_CREATED",
                "Task Created",
                "Task \"" + task.getTask() + "\" was created.",
                task.getCreatedAt(),
                "System",
                "INFO",
                null, "SYSTEM", null, "PENDING"
            ));
        }

        // ── 2. Due Date Scheduled ────────────────────────────────────────────
        if (task.getDueAt() != null) {
            events.add(new TaskHistoryEventDTO(
                "TASK_SCHEDULED",
                "Due Date Scheduled",
                "Scheduled for " + task.getDueAt().toString().replace("T", " at ") + ".",
                task.getCreatedAt() != null ? task.getCreatedAt() : task.getDueAt(),
                "System",
                "INFO",
                null, "SYSTEM", "PENDING", "SCHEDULED"
            ));
        }

        // ── 3. Submissions: each generates 1-3 events ────────────────────────
        List<TaskSubmission> submissions = submissionRepository.findByTaskId(taskId);
        for (TaskSubmission sub : submissions) {

            // 3a. Submission Added (Task Started/Validated by Patient)
            if (sub.getSubmittedAt() != null) {
                events.add(new TaskHistoryEventDTO(
                    "SUBMISSION_ADDED",
                    "Task Validated by Patient",
                    "The patient confirmed task completion.",
                    sub.getSubmittedAt(),
                    "Patient #" + sub.getPatientId(),
                    "INFO",
                    sub.getDescription(), "PATIENT", "SCHEDULED", "PENDING_VALIDATION"
                ));
            }

            // 3b. Submission Approved
            if ("approved".equalsIgnoreCase(sub.getValidationStatus()) && sub.getValidatedAt() != null) {
                events.add(new TaskHistoryEventDTO(
                    "SUBMISSION_APPROVED",
                    "Validation Approved",
                    "The caregiver approved the completion.",
                    sub.getValidatedAt(),
                    sub.getValidatedBy() != null ? sub.getValidatedBy() : "Caregiver",
                    "SUCCESS",
                    sub.getValidationComments(), "CAREGIVER", "PENDING_VALIDATION", "COMPLETED"
                ));
            }

            // 3c. Submission Rejected
            if ("rejected".equalsIgnoreCase(sub.getValidationStatus()) && sub.getValidatedAt() != null) {
                events.add(new TaskHistoryEventDTO(
                    "SUBMISSION_REJECTED",
                    "Validation Rejected",
                    "The completion was rejected by the caregiver.",
                    sub.getValidatedAt(),
                    sub.getValidatedBy() != null ? sub.getValidatedBy() : "Caregiver",
                    "DANGER",
                    sub.getValidationComments(), "CAREGIVER", "PENDING_VALIDATION", "REJECTED"
                ));
            }
        }

        // ── 4. Task Completed ────────────────────────────────────────────────
        if (Boolean.TRUE.equals(task.getIsDone())) {
            LocalDateTime completedAt = submissions.stream()
                .filter(s -> "approved".equalsIgnoreCase(s.getValidationStatus()) && s.getValidatedAt() != null)
                .map(TaskSubmission::getValidatedAt)
                .max(Comparator.naturalOrder())
                .orElse(null);

            if (completedAt != null) {
                events.add(new TaskHistoryEventDTO(
                    "TASK_COMPLETED",
                    "Task Completed",
                    "The task is officially marked as completed.",
                    completedAt,
                    "System",
                    "SUCCESS",
                    null, "SYSTEM", "PENDING_VALIDATION", "COMPLETED"
                ));
            }
        }

        // ── 5. Task Overdue ──────────────────────────────────────────────────
        if (!Boolean.TRUE.equals(task.getIsDone())
                && task.getDueAt() != null
                && task.getDueAt().isBefore(now)) {
            events.add(new TaskHistoryEventDTO(
                "TASK_OVERDUE",
                "Task Overdue",
                "The task deadline has passed.",
                task.getDueAt(),
                "System",
                "DANGER",
                null, "SYSTEM", "SCHEDULED", "OVERDUE"
            ));
        }

        // ── Sort by date ascending ───────────────────────────────────────────
        events.sort(Comparator.comparing(
            TaskHistoryEventDTO::getEventDate,
            Comparator.nullsLast(Comparator.naturalOrder())
        ));

        return events;
    }
}
