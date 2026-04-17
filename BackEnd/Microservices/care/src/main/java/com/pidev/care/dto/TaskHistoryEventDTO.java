package com.pidev.care.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

/**
 * Represents a single event in a task's reconstructed history timeline.
 * Events are derived purely from existing Task and TaskSubmission data.
 */
public class TaskHistoryEventDTO {

    /** Machine-readable event type, e.g. TASK_CREATED, SUBMISSION_ADDED, etc. */
    private String type;

    /** Human-readable title shown in the UI timeline */
    private String title;

    /** Optional extra detail (e.g. validation comments, description snippet) */
    private String description;

    /** Timestamp of the event */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime eventDate;

    /** Actor responsible for the event (caregiver name, system, patient id) */
    private String actor;

    /** High-level state at this point: INFO, SUCCESS, WARNING, DANGER */
    /** High-level state at this point: INFO, SUCCESS, WARNING, DANGER */
    private String status;

    /** Optional comment or note */
    private String comment;

    /** Type of actor: PATIENT, CAREGIVER, SYSTEM, ADMIN */
    private String actorType;

    /** Status before the event (if applicable) */
    private String statusBefore;

    /** Status after the event (if applicable) */
    private String statusAfter;

    public TaskHistoryEventDTO() {
    }

    public TaskHistoryEventDTO(String type, String title, String description,
                               LocalDateTime eventDate, String actor, String status) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.eventDate = eventDate;
        this.actor = actor;
        this.status = status;
    }

    public TaskHistoryEventDTO(String type, String title, String description,
                               LocalDateTime eventDate, String actor, String status,
                               String comment, String actorType, String statusBefore, String statusAfter) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.eventDate = eventDate;
        this.actor = actor;
        this.status = status;
        this.comment = comment;
        this.actorType = actorType;
        this.statusBefore = statusBefore;
        this.statusAfter = statusAfter;
    }

    // ── Getters / Setters ───────────────────────────────────────────────────

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getEventDate() { return eventDate; }
    public void setEventDate(LocalDateTime eventDate) { this.eventDate = eventDate; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getActorType() { return actorType; }
    public void setActorType(String actorType) { this.actorType = actorType; }

    public String getStatusBefore() { return statusBefore; }
    public void setStatusBefore(String statusBefore) { this.statusBefore = statusBefore; }

    public String getStatusAfter() { return statusAfter; }
    public void setStatusAfter(String statusAfter) { this.statusAfter = statusAfter; }
}
