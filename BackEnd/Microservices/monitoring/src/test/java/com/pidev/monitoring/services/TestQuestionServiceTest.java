package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.TestQuestion;
import com.pidev.monitoring.repositories.TestQuestionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TestQuestionServiceTest {

    @Mock
    private TestQuestionRepository testQuestionRepository;

    @Mock
    private CognitiveTestService cognitiveTestService;

    @InjectMocks
    private TestQuestionService testQuestionService;

    @Test
    void getAllQuestions_delegates() {
        List<TestQuestion> questions = List.of(new TestQuestion());
        when(testQuestionRepository.findAll()).thenReturn(questions);

        List<TestQuestion> result = testQuestionService.getAllQuestions();

        assertSame(questions, result);
        verify(testQuestionRepository).findAll();
    }

    @Test
    void getQuestionById_throwsWhenMissing() {
        when(testQuestionRepository.findById(5L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> testQuestionService.getQuestionById(5L));
        assertEquals("Question not found with id: 5", ex.getMessage());
    }

    @Test
    void getQuestionsByTestId_delegatesToCognitiveTestService() {
        CognitiveTest test = new CognitiveTest();
        List<TestQuestion> questions = List.of(new TestQuestion(), new TestQuestion());
        test.setQuestions(questions);

        when(cognitiveTestService.getTestById(10L)).thenReturn(test);

        List<TestQuestion> result = testQuestionService.getQuestionsByTestId(10L);

        assertSame(questions, result);
        verify(cognitiveTestService).getTestById(10L);
        verifyNoInteractions(testQuestionRepository);
    }

    @Test
    void createQuestion_saves() {
        TestQuestion question = new TestQuestion();
        when(testQuestionRepository.save(question)).thenReturn(question);

        TestQuestion saved = testQuestionService.createQuestion(question);

        assertSame(question, saved);
        verify(testQuestionRepository).save(question);
    }

    @Test
    void deleteQuestion_delegates() {
        testQuestionService.deleteQuestion(7L);

        verify(testQuestionRepository).deleteById(7L);
    }
}
