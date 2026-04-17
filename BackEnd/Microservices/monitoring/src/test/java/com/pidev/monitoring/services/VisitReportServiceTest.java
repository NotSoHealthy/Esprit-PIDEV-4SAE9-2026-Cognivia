package com.pidev.monitoring.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.ReportStatus;
import com.pidev.monitoring.entities.VisitReport;
import com.pidev.monitoring.events.GenericEvent;
import com.pidev.monitoring.rabbitMQ.EventPublisher;
import com.pidev.monitoring.repositories.VisitReportRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VisitReportServiceTest {

    @Mock
    private VisitReportRepository repository;

    @Mock
    private EventPublisher publisher;

    @Test
    void getAll_delegates() {
        List<VisitReport> list = List.of(new VisitReport());
        when(repository.findAll()).thenReturn(list);

        VisitReportService service = new VisitReportService(repository, publisher);
        assertSame(list, service.getAll());
        verify(repository).findAll();
    }

    @Test
    void getById_returnsNullWhenMissing() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        VisitReportService service = new VisitReportService(repository, publisher);
        assertNull(service.getById(1L));
    }

    @Test
    void create_publishesEventOnlyWhenValidated() {
        VisitReport input = new VisitReport();
        input.setStatus(ReportStatus.VALIDATED);
        input.setId(10L);
        input.setVisitId(20L);
        when(repository.save(input)).thenReturn(input);

        VisitReportService service = new VisitReportService(repository, publisher);
        VisitReport saved = service.create(input);

        assertSame(input, saved);

        ArgumentCaptor<GenericEvent> eventCaptor = ArgumentCaptor.forClass(GenericEvent.class);
        verify(publisher).sendGenericEvent(eventCaptor.capture(), eq("visit_report.validated"));
        assertEquals("VISIT_REPORT_SUBMITTED", eventCaptor.getValue().getEventType());
        assertEquals(10L, eventCaptor.getValue().getPayload().get("reportId"));
        assertEquals(20L, eventCaptor.getValue().getPayload().get("visitId"));
    }

    @Test
    void create_doesNotPublishWhenDraft() {
        VisitReport input = new VisitReport();
        input.setStatus(ReportStatus.DRAFT);
        when(repository.save(input)).thenReturn(input);

        VisitReportService service = new VisitReportService(repository, publisher);
        service.create(input);

        verifyNoInteractions(publisher);
    }

    @Test
    void update_throwsWhenMissing() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        VisitReportService service = new VisitReportService(repository, publisher);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.update(1L, new VisitReport()));
        assertEquals("Visit report not found", ex.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void update_updatesFields_andPublishesWhenValidated() {
        VisitReport existing = new VisitReport();
        existing.setId(1L);
        existing.setVisitId(20L);
        existing.setContent("old");
        existing.setStatus(ReportStatus.DRAFT);

        VisitReport patch = new VisitReport();
        patch.setContent("new");
        patch.setStatus(ReportStatus.VALIDATED);

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        VisitReportService service = new VisitReportService(repository, publisher);
        VisitReport saved = service.update(1L, patch);

        assertSame(existing, saved);
        assertEquals("new", existing.getContent());
        assertEquals(ReportStatus.VALIDATED, existing.getStatus());

        verify(publisher).sendGenericEvent(any(GenericEvent.class), eq("visit_report.validated"));
    }

    @Test
    void delete_delegates() {
        VisitReportService service = new VisitReportService(repository, publisher);
        service.delete(9L);
        verify(repository).deleteById(9L);
    }

    @Test
    void getByVisitId_delegates() {
        VisitReport report = new VisitReport();
        when(repository.findByVisitId(55L)).thenReturn(Optional.of(report));

        VisitReportService service = new VisitReportService(repository, publisher);
        assertSame(report, service.getByVisitId(55L));
        verify(repository).findByVisitId(55L);
    }
}
