package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.MultipleChoiceOption;
import com.pidev.monitoring.entities.QuestionType;
import com.pidev.monitoring.entities.TestQuestion;
import com.pidev.monitoring.repositories.CognitiveTestRepository;
import com.pidev.monitoring.repositories.TestQuestionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CognitiveTestServiceTest {

    @Mock
    private CognitiveTestRepository cognitiveTestRepository;

    @Mock
    private TestQuestionRepository testQuestionRepository;

    @InjectMocks
    private CognitiveTestService cognitiveTestService;

    @Test
    void getAllTests_delegates() {
        List<CognitiveTest> tests = List.of(new CognitiveTest());
        when(cognitiveTestRepository.findAll()).thenReturn(tests);

        List<CognitiveTest> result = cognitiveTestService.getAllTests();

        assertSame(tests, result);
        verify(cognitiveTestRepository).findAll();
    }

    @Test
    void getTestById_throwsWhenMissing() {
        when(cognitiveTestRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> cognitiveTestService.getTestById(99L));
        assertEquals("Test not found with id: 99", ex.getMessage());
    }

    @Test
    void createTest_setsQuestionAndOptionBackReferences() {
        CognitiveTest test = new CognitiveTest();

        TestQuestion q = new TestQuestion();
        q.setQuestionText("Question text");
        q.setQuestionType(QuestionType.MULTIPLE_CHOICE);

        MultipleChoiceOption opt = new MultipleChoiceOption();
        opt.setOptionText("A");
        q.setOptions(new ArrayList<>(List.of(opt)));

        test.setQuestions(new ArrayList<>(List.of(q)));

        when(cognitiveTestRepository.save(test)).thenReturn(test);

        CognitiveTest saved = cognitiveTestService.createTest(test);

        assertSame(test, saved);
        assertSame(test, q.getTest());
        assertSame(q, opt.getQuestion());
        verify(cognitiveTestRepository).save(test);
        verifyNoInteractions(testQuestionRepository);
    }

    @Test
    void addQuestionToTest_setsBackReferencesAndSaves() {
        CognitiveTest test = new CognitiveTest();
        test.setId(1L);
        test.setQuestions(new ArrayList<>());

        when(cognitiveTestRepository.findById(1L)).thenReturn(Optional.of(test));
        when(cognitiveTestRepository.save(any(CognitiveTest.class))).thenAnswer(inv -> inv.getArgument(0));

        TestQuestion question = new TestQuestion();
        question.setQuestionText("Question text");
        question.setQuestionType(QuestionType.MULTIPLE_CHOICE);

        MultipleChoiceOption opt = new MultipleChoiceOption();
        opt.setOptionText("A");
        question.setOptions(new ArrayList<>(List.of(opt)));

        CognitiveTest updated = cognitiveTestService.addQuestionToTest(1L, question);

        assertSame(test, updated);
        assertEquals(1, test.getQuestions().size());
        assertSame(test, question.getTest());
        assertSame(question, opt.getQuestion());
        verify(cognitiveTestRepository).save(test);
    }

    @Test
    void updateTest_replacesQuestionsAndFixesBackReferences() {
        CognitiveTest existing = new CognitiveTest();
        existing.setId(10L);
        existing.setTitle("Old title");
        existing.setDescription("Old description");

        TestQuestion oldQ = new TestQuestion();
        oldQ.setQuestionText("Old question");
        oldQ.setQuestionType(QuestionType.SIMPLE);
        oldQ.setTest(existing);
        existing.setQuestions(new ArrayList<>(List.of(oldQ)));

        CognitiveTest updates = new CognitiveTest();
        updates.setTitle("New title");
        updates.setDescription("New description");

        TestQuestion newQ = new TestQuestion();
        newQ.setQuestionText("New question");
        newQ.setQuestionType(QuestionType.MULTIPLE_CHOICE);
        MultipleChoiceOption opt = new MultipleChoiceOption();
        opt.setOptionText("A");
        newQ.setOptions(new ArrayList<>(List.of(opt)));

        updates.setQuestions(new ArrayList<>(List.of(newQ)));

        when(cognitiveTestRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(cognitiveTestRepository.save(any(CognitiveTest.class))).thenAnswer(inv -> inv.getArgument(0));

        CognitiveTest saved = cognitiveTestService.updateTest(10L, updates);

        assertSame(existing, saved);
        assertEquals("New title", existing.getTitle());
        assertEquals("New description", existing.getDescription());

        assertNull(oldQ.getTest());
        assertEquals(1, existing.getQuestions().size());
        assertSame(existing, newQ.getTest());
        assertSame(newQ, opt.getQuestion());
    }
}
