package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.TestQuestion;
import com.pidev.monitoring.services.CognitiveTestService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class CognitiveTestControllerTest {

    @Mock
    private CognitiveTestService service;

    private CognitiveTestController controller;

    @BeforeEach
    void setUp() {
        controller = new CognitiveTestController(service);
    }

    @Test
    void getAllTests_delegates() {
        List<CognitiveTest> list = List.of(new CognitiveTest());
        when(service.getAllTests()).thenReturn(list);
        assertSame(list, controller.getAllTests());
    }

    @Test
    void getTestById_wrapsInOkResponse() {
        CognitiveTest test = new CognitiveTest();
        when(service.getTestById(1L)).thenReturn(test);
        ResponseEntity<CognitiveTest> resp = controller.getTestById(1L);
        assertEquals(200, resp.getStatusCode().value());
        assertSame(test, resp.getBody());
    }

    @Test
    void createTest_delegates() {
        CognitiveTest input = new CognitiveTest();
        CognitiveTest created = new CognitiveTest();
        when(service.createTest(input)).thenReturn(created);
        assertSame(created, controller.createTest(input));
    }

    @Test
    void updateTest_delegates() {
        CognitiveTest input = new CognitiveTest();
        CognitiveTest updated = new CognitiveTest();
        when(service.updateTest(1L, input)).thenReturn(updated);
        assertSame(updated, controller.updateTest(1L, input));
    }

    @Test
    void addQuestionToTest_delegates() {
        TestQuestion q = new TestQuestion();
        CognitiveTest updated = new CognitiveTest();
        when(service.addQuestionToTest(2L, q)).thenReturn(updated);
        assertSame(updated, controller.addQuestionToTest(2L, q));
    }

    @Test
    void deleteTest_returnsNoContent() {
        ResponseEntity<Void> resp = controller.deleteTest(3L);
        assertEquals(204, resp.getStatusCode().value());
        verify(service).deleteTest(3L);
    }
}
