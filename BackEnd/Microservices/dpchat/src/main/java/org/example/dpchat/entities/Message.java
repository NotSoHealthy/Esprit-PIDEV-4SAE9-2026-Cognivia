package org.example.dpchat.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.ArrayList;

@Entity
@JsonIgnoreProperties(ignoreUnknown = true)
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String senderId;
    private String recipientId;
    private String content;
    private LocalDateTime timestamp;

    @JsonProperty("isRead")
    @Column(name = "is_read", nullable = false)
    private Boolean read = false;

    @Transient
    private String senderName;
    @Transient
    private String senderRole;

    @Column(name = "is_deleted")
    private Boolean deleted = false;

    @Column(name = "is_edited")
    private Boolean edited = false;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageReaction> reactions = new ArrayList<>();

    public Message() {
    }

    public Message(Long id, String senderId, String recipientId, String content, LocalDateTime timestamp,
            Boolean read, Boolean deleted, Boolean edited) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.content = content;
        this.timestamp = timestamp;
        this.read = read;
        this.deleted = deleted;
        this.edited = edited;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(String recipientId) {
        this.recipientId = recipientId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @JsonProperty("isRead")
    public Boolean isRead() {
        return read;
    }

    @JsonProperty("isRead")
    public void setRead(Boolean read) {
        this.read = read;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    @JsonProperty("isDeleted")
    public Boolean getDeleted() {
        return deleted != null && deleted;
    }

    @JsonProperty("isDeleted")
    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    @JsonProperty("isEdited")
    public Boolean getEdited() {
        return edited != null && edited;
    }

    @JsonProperty("isEdited")
    public void setEdited(Boolean edited) {
        this.edited = edited;
    }

    public List<MessageReaction> getReactions() {
        return reactions;
    }

    public void setReactions(List<MessageReaction> reactions) {
        this.reactions = reactions;
    }
}
