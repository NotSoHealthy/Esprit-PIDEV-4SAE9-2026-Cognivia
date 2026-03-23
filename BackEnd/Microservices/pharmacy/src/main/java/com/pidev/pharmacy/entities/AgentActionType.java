package com.pidev.pharmacy.entities;

public enum AgentActionType {
    DELETE,              // Medication should be deleted (e.g., already exists, obsolete)
    PATCH_AND_ACCEPT,    // Medication needs corrections but can be accepted
    ACCEPT,              // Medication is good to accept as-is
    REVIEW_REQUIRED      // Manual review needed
}
