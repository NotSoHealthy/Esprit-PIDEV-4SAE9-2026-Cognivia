package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.*;
import com.pidev.monitoring.rabbitMQ.EventPublisher;
import com.pidev.monitoring.repositories.CognitiveTestRepository;
import com.pidev.monitoring.repositories.TestAssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TestAssignmentServiceTest {

    @Mock
    private TestAssignmentRepository testAssignmentRepository;

    @Mock
    private CognitiveTestRepository cognitiveTestRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private TestAssignmentService testAssignmentService;

    private CognitiveTest testEntity;
    private TestAssignment assignment;

    @BeforeEach
    void setUp() {
        testEntity = new CognitiveTest();
        testEntity.setId(10L);
        testEntity.setTitle("Memory test");
        testEntity.setAssignments(new ArrayList<>());

        assignment = new TestAssignment();
        assignment.setId(1L);
        assignment.setFrequency(Frequency.ONCE);
    }

    @Test
    void testAssignTest_Targeted_Success() {
        assignment.setAssignmentType(AssignmentType.TARGETED);
        assignment.setPatientId(100L);

        when(cognitiveTestRepository.findById(10L)).thenReturn(Optional.of(testEntity));

        TestAssignment result = testAssignmentService.assignTest(10L, assignment);

        assertNotNull(result);
        assertEquals(testEntity, result.getTest());
        assertNotNull(result.getDueAt());
        verify(cognitiveTestRepository).save(testEntity);
    }

    @Test
    void testAssignTest_Targeted_MissingPatientId() {
        assignment.setAssignmentType(AssignmentType.TARGETED);
        assignment.setPatientId(null);

        when(cognitiveTestRepository.findById(10L)).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalArgumentException.class, () -> testAssignmentService.assignTest(10L, assignment));
    }

    @Test
    void testAssignTest_General_Success() {
        assignment.setAssignmentType(AssignmentType.GENERAL);
        assignment.setTargetSeverity(SeverityTarget.HIGH);

        when(cognitiveTestRepository.findById(10L)).thenReturn(Optional.of(testEntity));

        TestAssignment result = testAssignmentService.assignTest(10L, assignment);

        assertNotNull(result);
        assertEquals(SeverityTarget.HIGH, result.getTargetSeverity());
        verify(cognitiveTestRepository).save(testEntity);
    }

    @Test
    void testAssignTest_General_MissingSeverity() {
        assignment.setAssignmentType(AssignmentType.GENERAL);
        assignment.setTargetSeverity(null);

        when(cognitiveTestRepository.findById(10L)).thenReturn(Optional.of(testEntity));

        assertThrows(IllegalArgumentException.class, () -> testAssignmentService.assignTest(10L, assignment));
    }

    @Test
    void testGetAssignmentById() {
        when(testAssignmentRepository.findById(1L)).thenReturn(Optional.of(assignment));
        TestAssignment result = testAssignmentService.getAssignmentById(1L);
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }
}
