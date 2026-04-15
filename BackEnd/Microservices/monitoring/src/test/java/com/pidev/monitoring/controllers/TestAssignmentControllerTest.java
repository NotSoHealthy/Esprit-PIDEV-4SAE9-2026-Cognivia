package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.TestAssignment;
import com.pidev.monitoring.services.TestAssignmentService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class TestAssignmentControllerTest {

    @Mock
    private TestAssignmentService service;

    private TestAssignmentController controller;

    @BeforeEach
    void setUp() {
        controller = new TestAssignmentController(service);
    }

    @Test
    void assignTest_delegates() {
        TestAssignment input = new TestAssignment();
        TestAssignment created = new TestAssignment();
        when(service.assignTest(10L, input)).thenReturn(created);
        assertSame(created, controller.assignTest(10L, input));
    }

    @Test
    void healthCheck_returnsConstant() {
        assertTrue(controller.healthCheck().contains("Monitoring Service"));
    }

    @Test
    void getAssignmentById_returnsOk() {
        TestAssignment assignment = new TestAssignment();
        when(service.getAssignmentById(1L)).thenReturn(assignment);
        ResponseEntity<TestAssignment> resp = controller.getAssignmentById(1L);
        assertEquals(200, resp.getStatusCode().value());
        assertSame(assignment, resp.getBody());
    }

    @Test
    void getAllAssignments_delegates() {
        List<TestAssignment> list = List.of(new TestAssignment());
        when(service.getAllAssignments()).thenReturn(list);
        assertSame(list, controller.getAllAssignments());
    }

    @Test
    void getAssignmentsForPatient_delegates() {
        List<TestAssignment> list = List.of(new TestAssignment());
        when(service.getAssignmentsForPatient(7L)).thenReturn(list);
        assertSame(list, controller.getAssignmentsForPatient(7L));
    }
}
