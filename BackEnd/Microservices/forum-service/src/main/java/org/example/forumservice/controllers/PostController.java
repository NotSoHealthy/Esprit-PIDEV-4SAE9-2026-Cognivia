package org.example.forumservice.controllers;

import lombok.RequiredArgsConstructor;
import org.example.forumservice.entities.Post;
import org.example.forumservice.services.PostService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<Page<Post>> getAllPosts(
            @RequestParam(required = false) String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(postService.getPosts(userId, category, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostById(id));
    }

    @PostMapping
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        return new ResponseEntity<>(postService.createPost(post), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Long id, @RequestBody Post post) {
        return ResponseEntity.ok(postService.updatePost(id, post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<Post> togglePin(@PathVariable Long id, @RequestParam String userId) {
        return ResponseEntity.ok(postService.togglePin(id, userId));
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<Void> reportPost(@PathVariable Long id, @RequestParam String userId) {
        postService.reportPost(id, userId);
        return ResponseEntity.ok().build();
    }
}
