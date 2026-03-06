package com.pidev.pharmacy.entities;

public enum AgentLogAction {
    ACCEPTED,        // Agent accepted a medication
    REJECTED,        // Agent rejected (deleted) a medication
    MODIFIED,        // Agent modified and accepted a medication
    REVIEW_REJECTED  // Agent rejected a REVIEW_REQUIRED medication (when auto-delete is on)
}
