package com.pidev.care.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SubmissionValidationRequestTest {

    @Test
    void gettersAndSetters_work() {
        SubmissionValidationRequest req = new SubmissionValidationRequest();
        req.setValidationStatus("APPROVED");
        req.setValidationComments("ok");

        assertThat(req.getValidationStatus()).isEqualTo("APPROVED");
        assertThat(req.getValidationComments()).isEqualTo("ok");
    }

    @Test
    void allArgsConstructor_setsFields() {
        SubmissionValidationRequest req = new SubmissionValidationRequest("REJECTED", "no");
        assertThat(req.getValidationStatus()).isEqualTo("REJECTED");
        assertThat(req.getValidationComments()).isEqualTo("no");
    }
}
