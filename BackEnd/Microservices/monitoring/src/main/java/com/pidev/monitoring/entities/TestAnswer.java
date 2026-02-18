package com.pidev.monitoring.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
public class TestAnswer {

    public TestAnswer() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String answerText;

    @JsonProperty("isCorrect")
    private boolean isCorrect;

    @ManyToOne
    @JoinColumn(name = "result_id")
    @JsonBackReference
    private TestResult result;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private TestQuestion question;

    @ManyToOne
    @JoinColumn(name = "selected_option_id")
    private MultipleChoiceOption selectedOption;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public TestResult getResult() {
        return result;
    }

    public void setResult(TestResult result) {
        this.result = result;
    }

    public TestQuestion getQuestion() {
        return question;
    }

    public void setQuestion(TestQuestion question) {
        this.question = question;
    }

    public MultipleChoiceOption getSelectedOption() {
        return selectedOption;
    }

    public void setSelectedOption(MultipleChoiceOption selectedOption) {
        this.selectedOption = selectedOption;
    }
}
