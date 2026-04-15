package org.example.dpchat.entities;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long groupId;
    private String userId;
    
    @Column(name = "last_read_timestamp")
    private java.time.LocalDateTime lastReadTimestamp = java.time.LocalDateTime.now();

    @Column(name = "is_admin")
    private Boolean admin = false;

    public boolean isAdmin() {
        return admin != null && admin;
    }

    public GroupMember(Long groupId, String userId) {
        this.groupId = groupId;
        this.userId = userId;
    }

    public GroupMember(Long groupId, String userId, boolean admin) {
        this.groupId = groupId;
        this.userId = userId;
        this.admin = admin;
    }
}
