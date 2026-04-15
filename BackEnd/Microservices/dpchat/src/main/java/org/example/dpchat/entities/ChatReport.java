package org.example.dpchat.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class ChatReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reporterId;
    private String reportedUserId;
    private Long groupId; // Null for private chats
    private Long messageId; // Null for reporting entire conversations

    @Column(length = 1000)
    private String reason;

    private LocalDateTime timestamp;

    private String status = "PENDING"; // PENDING, RESOLVED

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
}
