package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.VisitReport;
import com.pidev.monitoring.services.VisitReportService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VisitReportControllerTest {

    @Mock
    private VisitReportService service;

    private VisitReportController controller;

    @BeforeEach
    void setUp() {
        controller = new VisitReportController(service);
    }

    @Test
    void getAllVisitReports_delegates() {
        List<VisitReport> list = List.of(new VisitReport());
        when(service.getAll()).thenReturn(list);
        assertSame(list, controller.getAllVisitReports());
    }

    @Test
    void getVisitReportById_delegates() {
        VisitReport report = new VisitReport();
        when(service.getById(1L)).thenReturn(report);
        assertSame(report, controller.getVisitReportById(1L));
    }

    @Test
    void getVisitReportByVisitId_delegates() {
        VisitReport report = new VisitReport();
        when(service.getByVisitId(2L)).thenReturn(report);
        assertSame(report, controller.getVisitReportByVisitId(2L));
    }

    @Test
    void createVisitReport_delegates() {
        VisitReport input = new VisitReport();
        VisitReport created = new VisitReport();
        when(service.create(input)).thenReturn(created);
        assertSame(created, controller.createVisitReport(input));
    }

    @Test
    void updateVisitReport_delegates() {
        VisitReport patch = new VisitReport();
        VisitReport updated = new VisitReport();
        when(service.update(5L, patch)).thenReturn(updated);
        assertSame(updated, controller.updateVisitReport(5L, patch));
    }

    @Test
    void deleteVisitReport_delegates() {
        controller.deleteVisitReport(9L);
        verify(service).delete(9L);
    }
}
