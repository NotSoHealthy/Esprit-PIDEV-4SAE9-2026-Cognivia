package com.pidev.care.controllers;

import com.pidev.care.entities.Task;
import com.pidev.care.services.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
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
    public Task getById(@PathVariable Long id) {
        return taskService.getById(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<Task> getByPatient(@PathVariable Long patientId) {
        return taskService.getByPatient(patientId);
    }

    @GetMapping("/user/{userId}")
    public List<Task> getByUser(@PathVariable Long userId) {
        return taskService.getByUser(userId);
    }

    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @RequestBody Task newData) {
        return taskService.update(id, newData);
    }

    @PutMapping("/{id}/done")
    public Task markDone(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean isDone = body.get("isDone");
        if (isDone == null) throw new IllegalArgumentException("isDone is required");
        return taskService.markDone(id, isDone);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
