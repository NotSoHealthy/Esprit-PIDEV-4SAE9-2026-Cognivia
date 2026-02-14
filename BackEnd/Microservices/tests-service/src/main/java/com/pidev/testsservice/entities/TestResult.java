package com.pidev.testsservice.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TestResult {

    public TestResult() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(columnDefinition = "TIMESTAMP")
    private LocalDateTime takenAt = LocalDateTime.now();

    private Long responseTime; // in milliseconds
    private Double score;
    private Long patientId;

    @ManyToOne
    @JoinColumn(name = "assignment_id")
    @JsonBackReference
    private TestAssignment assignment;

    @ManyToOne
    @JoinColumn(name = "test_id")
    @JsonIgnoreProperties({ "questions" })
    private CognitiveTest test;

    @OneToMany(mappedBy = "result", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<TestAnswer> answers = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getTakenAt() {
        return takenAt;
    }

    public void setTakenAt(LocalDateTime takenAt) {
        this.takenAt = takenAt;
    }

    public Long getResponseTime() {
        return responseTime;
    }

    public void setResponseTime(Long responseTime) {
        this.responseTime = responseTime;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public TestAssignment getAssignment() {
        return assignment;
    }

    public void setAssignment(TestAssignment assignment) {
        this.assignment = assignment;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public CognitiveTest getTest() {
        return test;
    }

    public void setTest(CognitiveTest test) {
        this.test = test;
    }

    public List<TestAnswer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<TestAnswer> answers) {
        this.answers = answers;
    }
}
