package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pidev.care.dto.SubmissionValidationRequest;
import com.pidev.care.entities.Task;
import com.pidev.care.entities.TaskSubmission;
import com.pidev.care.services.TaskService;
import com.pidev.care.services.TaskSubmissionService;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

    @Mock
    private TaskService taskService;

    @Mock
    private TaskSubmissionService submissionService;

    private TaskController controller;

    @BeforeEach
    void setUp() {
        controller = new TaskController(taskService, submissionService);
    }

    @Test
    void create_returns201AndLocation() {
        Task input = new Task();
        Task created = new Task();
        created.setId(123L);
        when(taskService.create(input)).thenReturn(created);

        ResponseEntity<Task> response = controller.create(input);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isEqualTo(URI.create("/api/tasks/123"));
        assertThat(response.getBody()).isSameAs(created);
    }

    @Test
    void getAll_delegatesToService() {
        List<Task> tasks = List.of(new Task());
        when(taskService.getAll()).thenReturn(tasks);

        assertThat(controller.getAll()).isSameAs(tasks);
    }

    @Test
    void getById_delegatesToService() {
        Task task = new Task();
        when(taskService.getById(1L)).thenReturn(task);

        assertThat(controller.getById(1L)).isSameAs(task);
    }

    @Test
    void getByPatient_delegatesToService() {
        List<Task> tasks = List.of(new Task());
        when(taskService.getByPatient(10L)).thenReturn(tasks);

        assertThat(controller.getByPatient(10L)).isSameAs(tasks);
    }

    @Test
    void getByUser_delegatesToService() {
        List<Task> tasks = List.of(new Task());
        when(taskService.getByUser(20L)).thenReturn(tasks);

        assertThat(controller.getByUser(20L)).isSameAs(tasks);
    }

    @Test
    void update_delegatesToService() {
        Task patch = new Task();
        Task updated = new Task();
        when(taskService.update(1L, patch)).thenReturn(updated);

        assertThat(controller.update(1L, patch)).isSameAs(updated);
    }

    @Test
    void markDone_requiresIsDone() {
        assertThatThrownBy(() -> controller.markDone(1L, Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("isDone is required");
    }

    @Test
    void markDone_delegatesToService() {
        Task updated = new Task();
        when(taskService.markDone(1L, true)).thenReturn(updated);

        assertThat(controller.markDone(1L, Map.of("isDone", true))).isSameAs(updated);
        verify(taskService).markDone(1L, true);
    }

    @Test
    void delete_delegatesToServiceAndReturns204() {
        ResponseEntity<Void> response = controller.delete(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(taskService).delete(1L);
    }

    @Test
    void submitTask_setsTaskIdBeforeCreate() {
        TaskSubmission submission = new TaskSubmission();
        TaskSubmission created = new TaskSubmission();
        created.setId(55L);
        when(submissionService.create(any(TaskSubmission.class))).thenReturn(created);

        ResponseEntity<TaskSubmission> response = controller.submitTask(9L, submission);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation())
                .isEqualTo(URI.create("/api/tasks/9/submissions/55"));
        assertThat(response.getBody()).isSameAs(created);

        ArgumentCaptor<TaskSubmission> captor = ArgumentCaptor.forClass(TaskSubmission.class);
        verify(submissionService).create(captor.capture());
        assertThat(captor.getValue().getTaskId()).isEqualTo(9L);
    }

    @Test
    void getSubmissions_delegatesToService() {
        List<TaskSubmission> list = List.of(new TaskSubmission());
        when(submissionService.getByTaskId(9L)).thenReturn(list);

        assertThat(controller.getSubmissions(9L)).isSameAs(list);
    }

    @Test
    void getSubmission_delegatesToService() {
        TaskSubmission submission = new TaskSubmission();
        when(submissionService.getById(2L)).thenReturn(submission);

        assertThat(controller.getSubmission(1L, 2L)).isSameAs(submission);
    }

    @Test
    void validateSubmission_passesCaregiverIdAsStringOrNull() {
        SubmissionValidationRequest request = new SubmissionValidationRequest("APPROVED", "ok");
        TaskSubmission validated = new TaskSubmission();
        when(submissionService.validate(2L, "APPROVED", "ok", "10")).thenReturn(validated);

        assertThat(controller.validateSubmission(1L, 2L, request, 10L)).isSameAs(validated);
        verify(submissionService).validate(2L, "APPROVED", "ok", "10");
    }

    @Test
    void validateSubmission_allowsNullCaregiverId() {
        SubmissionValidationRequest request = new SubmissionValidationRequest("REJECTED", "no");
        TaskSubmission validated = new TaskSubmission();
        when(submissionService.validate(2L, "REJECTED", "no", null)).thenReturn(validated);

        assertThat(controller.validateSubmission(1L, 2L, request, null)).isSameAs(validated);
        verify(submissionService).validate(2L, "REJECTED", "no", null);
    }

    @Test
    void deleteSubmission_delegatesToServiceAndReturns204() {
        ResponseEntity<Void> response = controller.deleteSubmission(1L, 2L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(submissionService).delete(2L);
    }
}
