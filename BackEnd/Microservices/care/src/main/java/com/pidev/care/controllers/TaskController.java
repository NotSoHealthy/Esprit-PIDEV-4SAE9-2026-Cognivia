package com.pidev.care.controllers;

import com.pidev.care.dto.SubmissionValidationRequest;
import com.pidev.care.dto.TaskHistoryEventDTO;
import com.pidev.care.entities.Task;
import com.pidev.care.entities.TaskSubmission;
import com.pidev.care.services.TaskService;
import com.pidev.care.services.TaskSubmissionService;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;
    private final TaskSubmissionService submissionService;

    public TaskController(TaskService taskService, TaskSubmissionService submissionService) {
        this.taskService = taskService;
        this.submissionService = submissionService;
    }

    @PostMapping
    public ResponseEntity<Task> create(@RequestBody Task task) {
        Task created = taskService.create(task);
        return ResponseEntity.created(URI.create("/api/tasks/" + created.getId())).body(created);
    }

    @GetMapping
    public List<Task> getAll() {
        return taskService.getAll();
    }

    @GetMapping("/{id}")
    public Task getById(@PathVariable("id") Long id) {
        return taskService.getById(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<Task> getByPatient(@PathVariable("patientId") Long patientId) {
        return taskService.getByPatient(patientId);
    }

    @GetMapping("/user/{userId}")
    public List<Task> getByUser(@PathVariable("userId") Long userId) {
        return taskService.getByUser(userId);
    }

    @PutMapping("/{id}")
    public Task update(@PathVariable("id") Long id, @RequestBody Task newData) {
        return taskService.update(id, newData);
    }

    @PutMapping("/{id}/done")
    public Task markDone(@PathVariable("id") Long id, @RequestBody Map<String, Boolean> body) {
        Boolean isDone = body.get("isDone");
        if (isDone == null)
            throw new IllegalArgumentException("isDone is required");
        return taskService.markDone(id, isDone);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Task Submission Endpoints
    @PostMapping("/{taskId}/submissions")
    public ResponseEntity<TaskSubmission> submitTask(@PathVariable("taskId") Long taskId,
            @RequestBody TaskSubmission submission) {
        submission.setTaskId(taskId);
        TaskSubmission created = submissionService.create(submission);
        return ResponseEntity.created(URI.create("/api/tasks/" + taskId + "/submissions/" + created.getId()))
                .body(created);
    }

    @GetMapping("/{taskId}/submissions")
    public List<TaskSubmission> getSubmissions(@PathVariable("taskId") Long taskId) {
        return submissionService.getByTaskId(taskId);
    }

    @GetMapping("/{taskId}/submissions/{submissionId}")
    public TaskSubmission getSubmission(@PathVariable("taskId") Long taskId, @PathVariable("submissionId") Long submissionId) {
        return submissionService.getById(submissionId);
    }

    @PutMapping("/{taskId}/submissions/{submissionId}/validate")
    public TaskSubmission validateSubmission(
            @PathVariable("taskId") Long taskId,
            @PathVariable("submissionId") Long submissionId,
            @RequestBody SubmissionValidationRequest request,
            @RequestParam(value = "caregiverId", required = false) Long caregiverId) {
        String caregiverStr = caregiverId != null ? caregiverId.toString() : null;
        return submissionService.validate(submissionId, request.getValidationStatus(),
                request.getValidationComments(), caregiverStr);
    }

    @DeleteMapping("/{taskId}/submissions/{submissionId}")
    public ResponseEntity<Void> deleteSubmission(@PathVariable("taskId") Long taskId, @PathVariable("submissionId") Long submissionId) {
        submissionService.delete(submissionId);
        return ResponseEntity.noContent().build();
    }

    // Task History Endpoint — reconstructed from existing data, no new tables
    @GetMapping("/{taskId}/history")
    public ResponseEntity<List<TaskHistoryEventDTO>> getTaskHistory(@PathVariable("taskId") Long taskId) {
        List<TaskHistoryEventDTO> history = taskService.getTaskHistory(taskId);
        return ResponseEntity.ok(history);
    }
}
