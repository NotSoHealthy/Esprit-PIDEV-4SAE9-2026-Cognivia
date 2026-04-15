package com.pidev.care.services;

import com.pidev.care.entities.Visit;
import com.pidev.care.entities.VisitStatus;
import com.pidev.care.rabbitMQ.EventPublisher;
import com.pidev.care.repositories.VisitRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VisitServiceTest {

    @Mock
    private VisitRepository visitRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private VisitService visitService;

    @Test
    void getAll_delegates() {
        List<Visit> visits = List.of(new Visit());
        when(visitRepository.findAll()).thenReturn(visits);

        List<Visit> result = visitService.getAll();

        assertThat(result).isSameAs(visits);
        verify(visitRepository).findAll();
    }

    @Test
    void getById_returnsNullWhenMissing() {
        when(visitRepository.findById(99L)).thenReturn(Optional.empty());

        assertThat(visitService.getById(99L)).isNull();
    }

    @Test
    void create_savesAndPublishesEvent() {
        Visit visit = new Visit();
        Visit savedVisit = new Visit();
        savedVisit.setId(123L);
        when(visitRepository.save(visit)).thenReturn(savedVisit);

        Visit saved = visitService.create(visit);

        assertThat(saved).isSameAs(savedVisit);
        verify(visitRepository).save(visit);
        verify(eventPublisher).sendGenericEvent(any(), eq("visit.created"));
    }

    @Test
    void update_throwsWhenMissing() {
        when(visitRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> visitService.update(5L, new Visit()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Visit not found");

        verify(visitRepository, never()).save(any());
    }

    @Test
    void update_updatesFieldsAndSaves() {
        Visit existing = new Visit();
        existing.setId(1L);
        existing.setStatus(VisitStatus.SCHEDULED);

        Visit patch = new Visit();
        patch.setStatus(VisitStatus.MISSED);

        when(visitRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(visitRepository.save(existing)).thenReturn(existing);

        Visit updated = visitService.update(1L, patch);

        assertThat(updated.getStatus()).isEqualTo(VisitStatus.MISSED);
        verify(visitRepository).save(existing);
    }

    @Test
    void markVisitAsCompleted_throwsWhenMissing() {
        when(visitRepository.findById(7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> visitService.markVisitAsCompleted(7L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Visit not found");
    }

    @Test
    void markVisitAsCompleted_setsCompletedAndSaves() {
        Visit existing = new Visit();
        existing.setId(7L);
        existing.setStatus(VisitStatus.SCHEDULED);

        when(visitRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(visitRepository.save(existing)).thenReturn(existing);

        visitService.markVisitAsCompleted(7L);

        assertThat(existing.getStatus()).isEqualTo(VisitStatus.COMPLETED);
        verify(visitRepository).save(existing);
    }
}
