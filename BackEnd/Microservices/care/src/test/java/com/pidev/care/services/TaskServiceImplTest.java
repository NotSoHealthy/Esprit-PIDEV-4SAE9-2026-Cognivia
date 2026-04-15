package com.pidev.care.services;

import com.pidev.care.entities.Task;
import com.pidev.care.entities.TaskType;
import com.pidev.care.repositories.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskServiceImpl taskService;

    @Captor
    private ArgumentCaptor<Task> taskCaptor;

    @Test
    void create_requiresPatientId() {
        Task task = validTask();
        task.setPatientId(null);

        assertThatThrownBy(() -> taskService.create(task))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("patientId is required");

        verifyNoInteractions(taskRepository);
    }

    @Test
    void create_requiresUserId() {
        Task task = validTask();
        task.setUserId(null);

        assertThatThrownBy(() -> taskService.create(task))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("userId is required");

        verifyNoInteractions(taskRepository);
    }

    @Test
    void create_requiresTaskText() {
        Task task = validTask();
        task.setTask("  ");

        assertThatThrownBy(() -> taskService.create(task))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("task is required");

        verifyNoInteractions(taskRepository);
    }

    @Test
    void create_requiresTaskType() {
        Task task = validTask();
        task.setTaskType(null);

        assertThatThrownBy(() -> taskService.create(task))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("taskType is required");

        verifyNoInteractions(taskRepository);
    }

    @Test
    void create_requiresDueAt() {
        Task task = validTask();
        task.setDueAt(null);

        assertThatThrownBy(() -> taskService.create(task))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("dueAt is required");

        verifyNoInteractions(taskRepository);
    }

    @Test
    void create_setsDefaultsAndSaves() {
        Task task = validTask();
        task.setIsDone(true);
        task.setCreatedAt(null);

        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task saved = taskService.create(task);

        assertThat(saved.getIsDone()).isFalse();
        assertThat(saved.getCreatedAt()).isNotNull();
        verify(taskRepository).save(task);
    }

    @Test
    void getById_throwsWhenMissing() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Task not found with id: 99");
    }

    @Test
    void getAll_delegates() {
        List<Task> tasks = List.of(validTask());
        when(taskRepository.findAll()).thenReturn(tasks);

        List<Task> result = taskService.getAll();

        assertThat(result).isSameAs(tasks);
        verify(taskRepository).findAll();
    }

    @Test
    void update_updatesOnlyProvidedFields() {
        Task existing = validTask();
        existing.setId(1L);
        existing.setTask("original");
        existing.setTaskType(TaskType.MEAL);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task patch = new Task();
        patch.setTask("updated");
        patch.setTaskType(null);
        patch.setPatientId(null);
        patch.setUserId(null);
        patch.setDueAt(null);

        Task updated = taskService.update(1L, patch);

        assertThat(updated.getTask()).isEqualTo("updated");
        assertThat(updated.getTaskType()).isEqualTo(TaskType.MEAL);
        verify(taskRepository).save(existing);
    }

    @Test
    void markDone_setsFlagAndSaves() {
        Task existing = validTask();
        existing.setId(5L);
        existing.setIsDone(false);

        when(taskRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task updated = taskService.markDone(5L, true);

        assertThat(updated.getIsDone()).isTrue();
        verify(taskRepository).save(existing);
    }

    @Test
    void delete_loadsThenDeletes() {
        Task existing = validTask();
        existing.setId(10L);

        when(taskRepository.findById(10L)).thenReturn(Optional.of(existing));

        taskService.delete(10L);

        verify(taskRepository).delete(existing);
    }

    private static Task validTask() {
        Task task = new Task();
        task.setPatientId(1L);
        task.setUserId(2L);
        task.setTask("Do something");
        task.setTaskType(TaskType.MEDICATION);
        task.setCreatedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        task.setDueAt(LocalDateTime.of(2026, 1, 2, 0, 0));
        task.setIsDone(false);
        return task;
    }
}
