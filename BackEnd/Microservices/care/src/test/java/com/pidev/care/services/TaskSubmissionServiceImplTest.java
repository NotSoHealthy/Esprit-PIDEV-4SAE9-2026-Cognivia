package com.pidev.care.services;

import com.pidev.care.entities.TaskSubmission;
import com.pidev.care.repositories.TaskSubmissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskSubmissionServiceImplTest {

    @Mock
    private TaskSubmissionRepository repository;

    @InjectMocks
    private TaskSubmissionServiceImpl service;

    @Test
    void create_requiresTaskIdAndPatientId() {
        TaskSubmission submission = new TaskSubmission();
        submission.setDescription("desc");

        assertThatThrownBy(() -> service.create(submission))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).isEqualTo("Task ID and Patient ID are required");
                });

        verifyNoInteractions(repository);
    }

    @Test
    void create_requiresDescription() {
        TaskSubmission submission = new TaskSubmission();
        submission.setTaskId(1L);
        submission.setPatientId(2L);
        submission.setDescription("  ");

        assertThatThrownBy(() -> service.create(submission))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).isEqualTo("Description is required");
                });

        verifyNoInteractions(repository);
    }

    @Test
    void create_setsDefaultsAndSaves() {
        TaskSubmission submission = new TaskSubmission();
        submission.setTaskId(1L);
        submission.setPatientId(2L);
        submission.setDescription("desc");
        submission.setSubmittedAt(null);

        when(repository.save(any(TaskSubmission.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskSubmission saved = service.create(submission);

        assertThat(saved.getValidationStatus()).isEqualTo("pending");
        assertThat(saved.getSubmittedAt()).isNotNull();
        verify(repository).save(submission);
    }

    @Test
    void getById_throwsNotFoundWhenMissing() {
        when(repository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(9L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(rse.getReason()).isEqualTo("Submission not found");
                });
    }

    @Test
    void validate_rejectsInvalidStatus() {
        assertThatThrownBy(() -> service.validate(1L, "pending", "c", "me"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).isEqualTo("Invalid validation status");
                });

        verifyNoInteractions(repository);
    }

    @Test
    void validate_setsFieldsAndTimestamp() {
        TaskSubmission existing = new TaskSubmission();
        existing.setId(1L);
        existing.setValidationStatus("pending");
        existing.setValidatedAt(null);

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(TaskSubmission.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskSubmission saved = service.validate(1L, "approved", "ok", "admin");

        assertThat(saved.getValidationStatus()).isEqualTo("approved");
        assertThat(saved.getValidationComments()).isEqualTo("ok");
        assertThat(saved.getValidatedBy()).isEqualTo("admin");
        assertThat(saved.getValidatedAt()).isNotNull();
        verify(repository).save(existing);
    }

    @Test
    void update_updatesOnlyProvidedFields() {
        TaskSubmission existing = new TaskSubmission();
        existing.setId(1L);
        existing.setDescription("old");
        existing.setPictureData("oldpic");
        existing.setSubmittedAt(LocalDateTime.of(2026, 1, 1, 0, 0));

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(TaskSubmission.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskSubmission patch = new TaskSubmission();
        patch.setDescription("new");

        TaskSubmission saved = service.update(1L, patch);

        assertThat(saved.getDescription()).isEqualTo("new");
        assertThat(saved.getPictureData()).isEqualTo("oldpic");
        verify(repository).save(existing);
    }

    @Test
    void delete_deletesExisting() {
        TaskSubmission existing = new TaskSubmission();
        existing.setId(3L);

        when(repository.findById(3L)).thenReturn(Optional.of(existing));

        service.delete(3L);

        verify(repository).delete(existing);
    }
}
