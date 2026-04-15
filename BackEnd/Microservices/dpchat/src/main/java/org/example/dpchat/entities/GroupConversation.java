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
public class GroupConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String creatorId;
    private LocalDateTime createdAt;

    public GroupConversation(String name, String creatorId) {
        this.name = name;
        this.creatorId = creatorId;
        this.createdAt = LocalDateTime.now();
    }
}
