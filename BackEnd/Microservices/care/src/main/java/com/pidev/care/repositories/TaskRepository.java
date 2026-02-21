package com.pidev.care.repositories;

import com.pidev.care.entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByPatientId(Long patientId);
    List<Task> findByUserId(Long userId);
    List<Task> findByPatientIdAndIsDoneFalse(Long patientId);
    List<Task> findByDueAtBeforeAndIsDoneFalse(LocalDateTime time);
}
