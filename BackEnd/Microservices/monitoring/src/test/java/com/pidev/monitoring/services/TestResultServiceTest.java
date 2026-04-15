package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.*;
import com.pidev.monitoring.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TestResultServiceTest {

    @Mock private TestResultRepository testResultRepository;
    @Mock private TestAssignmentRepository testAssignmentRepository;
    @Mock private CognitiveTestRepository cognitiveTestRepository;
    @Mock private TestQuestionRepository testQuestionRepository;
    @Mock private RiskScoreRepository riskScoreRepository;

    @InjectMocks
    private TestResultService testResultService;

    private TestAssignment assignment;
    private CognitiveTest testEntity;
    private TestResult resultEntity;

    @BeforeEach
    void setUp() {
        testEntity = new CognitiveTest();
        testEntity.setId(10L);

        assignment = new TestAssignment();
        assignment.setId(1L);
        assignment.setTest(testEntity);
        assignment.setAssignmentType(AssignmentType.TARGETED);
        assignment.setPatientId(100L);
        assignment.setResults(new ArrayList<>());

        resultEntity = new TestResult();
        resultEntity.setId(50L);
        resultEntity.setPatientId(100L);
        resultEntity.setAnswers(new ArrayList<>());
    }

    @Test
    void testCalculateScore_SimpleQuestions() {
        TestQuestion q1 = new TestQuestion();
        q1.setId(1L);
        q1.setQuestionType(QuestionType.SIMPLE);
        q1.setCorrectAnswer("Paris");

        TestAnswer a1 = new TestAnswer();
        a1.setQuestion(q1);
        a1.setAnswerText("Paris");

        resultEntity.setAnswers(List.of(a1));

        when(testAssignmentRepository.findById(1L)).thenReturn(Optional.of(assignment));
        when(testQuestionRepository.findById(1L)).thenReturn(Optional.of(q1));
        when(testResultRepository.saveAndFlush(any(TestResult.class))).thenReturn(resultEntity);
        // Risk engine mocks for the indirect call
        when(testResultRepository.findAllByPatientIdAndTakenAtAfterOrderByTakenAtDesc(anyLong(), any()))
                .thenReturn(Collections.emptyList());

        TestResult result = testResultService.submitResult(1L, resultEntity);

        assertNotNull(result);
        assertEquals(100.0, result.getScore());
        assertTrue(a1.isCorrect());
    }

    @Test
    void testCalculateScore_PartialCorrect() {
        TestQuestion q1 = new TestQuestion();
        q1.setId(1L);
        q1.setQuestionType(QuestionType.SIMPLE);
        q1.setCorrectAnswer("Right");

        TestAnswer a1 = new TestAnswer();
        a1.setQuestion(q1);
        a1.setAnswerText("Right");

        TestAnswer a2 = new TestAnswer();
        a2.setQuestion(q1);
        a2.setAnswerText("Wrong");

        resultEntity.setAnswers(List.of(a1, a2));

        when(testAssignmentRepository.findById(1L)).thenReturn(Optional.of(assignment));
        when(testQuestionRepository.findById(1L)).thenReturn(Optional.of(q1));
        when(testResultRepository.saveAndFlush(any(TestResult.class))).thenReturn(resultEntity);
        when(testResultRepository.findAllByPatientIdAndTakenAtAfterOrderByTakenAtDesc(anyLong(), any()))
                .thenReturn(Collections.emptyList());

        TestResult result = testResultService.submitResult(1L, resultEntity);

        assertEquals(50.0, result.getScore());
    }

    @Test
    void testRiskGeneration_CalledOnSubmit() {
        when(testAssignmentRepository.findById(1L)).thenReturn(Optional.of(assignment));
        when(testResultRepository.saveAndFlush(any(TestResult.class))).thenReturn(resultEntity);
        when(testResultRepository.findAllByPatientIdAndTakenAtAfterOrderByTakenAtDesc(anyLong(), any()))
                .thenReturn(Collections.emptyList());

        testResultService.submitResult(1L, resultEntity);

        verify(riskScoreRepository, atLeastOnce()).save(any(RiskScore.class));
    }

    @Test
    void testGetResultsByPatientId() {
        when(testResultRepository.findByPatientId(100L)).thenReturn(Collections.singletonList(resultEntity));
        List<TestResult> results = testResultService.getResultsByPatientId(100L);
        assertEquals(1, results.size());
    }
}
