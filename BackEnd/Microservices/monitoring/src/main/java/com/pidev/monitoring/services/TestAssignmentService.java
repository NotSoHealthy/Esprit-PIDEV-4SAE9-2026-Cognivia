package com.pidev.monitoring.services;

import java.util.List;

import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.TestAssignment;
import com.pidev.monitoring.repositories.CognitiveTestRepository;
import com.pidev.monitoring.repositories.TestAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestAssignmentService {

    private final TestAssignmentRepository testAssignmentRepository;
    private final CognitiveTestRepository cognitiveTestRepository;

    public TestAssignmentService(TestAssignmentRepository testAssignmentRepository,
            CognitiveTestRepository cognitiveTestRepository) {
        this.testAssignmentRepository = testAssignmentRepository;
        this.cognitiveTestRepository = cognitiveTestRepository;
    }

    @Transactional
    public TestAssignment assignTest(Long testId, TestAssignment assignment) {
        CognitiveTest test = cognitiveTestRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with id: " + testId));

        assignment.setTest(test);
        test.getAssignments().add(assignment);
        cognitiveTestRepository.save(test);
        return assignment;
    }

    public TestAssignment getAssignmentById(Long id) {
        return testAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + id));
    }

    public List<TestAssignment> getAllAssignments() {
        return testAssignmentRepository.findAll();
    }
}
