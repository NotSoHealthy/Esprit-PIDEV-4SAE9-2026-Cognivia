package org.example.dpchat.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String senderId;
    private String recipientId;
    private Long groupId; // Added for group chat support
    
    @Convert(converter = org.example.dpchat.config.MessageEncryptionConverter.class)
    private String content;

    private String type = "text";
    private LocalDateTime timestamp;

    @JsonProperty("isRead")
    @Column(name = "is_read", nullable = false)
    private Boolean read = false;

    @JsonProperty("seenBy")
    @Transient
    private List<String> seenBy = new ArrayList<>();

    @Transient
    private String senderName;

    @Transient
    private String senderRole;

    @JsonProperty("isDeleted")
    @Column(name = "is_deleted")
    private Boolean deleted = false;

    @JsonProperty("isEdited")
    @Column(name = "is_edited")
    private Boolean edited = false;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageReaction> reactions = new ArrayList<>();
}
