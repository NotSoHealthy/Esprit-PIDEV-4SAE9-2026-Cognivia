package org.example.forumservice.entities;

import jakarta.persistence.*;

@Entity
public class PinnedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;

    public PinnedPost() {
    }

    public PinnedPost(Long id, String userId, Post post) {
        this.id = id;
        this.userId = userId;
        this.post = post;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }
}
