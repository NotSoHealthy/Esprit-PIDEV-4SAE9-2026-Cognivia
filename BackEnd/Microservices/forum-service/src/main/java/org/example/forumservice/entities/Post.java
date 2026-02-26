package org.example.forumservice.entities;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Reaction> reactions = new ArrayList<>();

    private String userId;

    private String username;

    private boolean banned;

    private String category;

    @Transient
    private boolean pinned;

    @Transient
    private long likeCount;

    @Transient
    private long dislikeCount;

    @Transient
    private long loveCount;

    @Transient
    private long hahaCount;

    @Transient
    private long wowCount;

    @Transient
    private long sadCount;

    @Transient
    private long angryCount;

    @Transient
    private long commentCount;

    @Transient
    private String authorFullName;

    @Transient
    private String authorRole;

    @Transient
    private ReactionType userReaction;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
