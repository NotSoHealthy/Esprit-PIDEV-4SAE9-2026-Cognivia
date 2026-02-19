package com.esprit.microservice.taskservice.Service;

import com.esprit.microservice.taskservice.Entity.Task;
import com.esprit.microservice.taskservice.Repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;

    public TaskServiceImpl(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Override
    public Task create(Task task) {
        if (task.getPatientId() == null) throw new IllegalArgumentException("patientId is required");
        if (task.getUserId() == null) throw new IllegalArgumentException("userId is required");
        if (task.getTask() == null || task.getTask().isBlank()) throw new IllegalArgumentException("task is required");
        if (task.getTaskType() == null) throw new IllegalArgumentException("taskType is required");
        if (task.getDueAt() == null) throw new IllegalArgumentException("dueAt is required");

        // ✅ default false
        task.setIsDone(false);

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

        if (newData.getPatientId() != null) existing.setPatientId(newData.getPatientId());
        if (newData.getUserId() != null) existing.setUserId(newData.getUserId());

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
}
