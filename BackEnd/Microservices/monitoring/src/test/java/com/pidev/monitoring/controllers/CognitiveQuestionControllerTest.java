package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.TestQuestion;
import com.pidev.monitoring.services.TestQuestionService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class CognitiveQuestionControllerTest {

    @Mock
    private TestQuestionService service;

    private CognitiveQuestionController controller;

    @BeforeEach
    void setUp() {
        controller = new CognitiveQuestionController(service);
    }

    @Test
    void createQuestion_delegates() {
        TestQuestion input = new TestQuestion();
        TestQuestion created = new TestQuestion();
        when(service.createQuestion(input)).thenReturn(created);
        assertSame(created, controller.createQuestion(input));
    }

    @Test
    void getAllQuestions_delegates() {
        List<TestQuestion> list = List.of(new TestQuestion());
        when(service.getAllQuestions()).thenReturn(list);
        assertSame(list, controller.getAllQuestions());
    }

    @Test
    void getQuestionsByTest_delegates() {
        List<TestQuestion> list = List.of(new TestQuestion());
        when(service.getQuestionsByTestId(1L)).thenReturn(list);
        assertSame(list, controller.getQuestionsByTest(1L));
    }

    @Test
    void deleteQuestion_returnsNoContent() {
        ResponseEntity<Void> resp = controller.deleteQuestion(3L);
        assertEquals(204, resp.getStatusCode().value());
        verify(service).deleteQuestion(3L);
    }
}
