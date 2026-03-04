package com.pidev.care.dto;

public class SubmissionValidationRequest {
    private String validationStatus;
    private String validationComments;

    public SubmissionValidationRequest() {}

    public SubmissionValidationRequest(String validationStatus, String validationComments) {
        this.validationStatus = validationStatus;
        this.validationComments = validationComments;
    }

    public String getValidationStatus() {
        return validationStatus;
    }

    public void setValidationStatus(String validationStatus) {
        this.validationStatus = validationStatus;
    }

    public String getValidationComments() {
        return validationComments;
    }

    public void setValidationComments(String validationComments) {
        this.validationComments = validationComments;
    }
}
