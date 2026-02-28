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

    private Boolean banned;

    private String category;

    @ElementCollection
    @CollectionTable(name = "post_keywords", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "keyword")
    private List<String> keywords = new ArrayList<>();

    private Boolean isRepost = false;
    private Long originalPostId;
    private String originalUserId;
    private String originalUsername;

    @Transient
    private Boolean pinned;

    @Transient
    private Long likeCount;

    @Transient
    private Long dislikeCount;

    @Transient
    private Long loveCount;

    @Transient
    private Long hahaCount;

    @Transient
    private Long wowCount;

    @Transient
    private Long sadCount;

    @Transient
    private Long angryCount;

    @Transient
    private Long commentCount;

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
