package com.pidev.care.services;



import com.pidev.care.entities.Task;

import java.util.List;

public interface TaskService {
    Task create(Task task);
    Task getById(Long id);
    List<Task> getAll();
    List<Task> getByPatient(Long patientId);
    List<Task> getByUser(Long userId);
    Task update(Long id, Task newData);
    Task markDone(Long id, boolean isDone);
    void delete(Long id);
}
