package org.example.forumservice.controllers;

import lombok.RequiredArgsConstructor;
import org.example.forumservice.entities.Comment;
import org.example.forumservice.services.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<List<Comment>> getCommentsByPostId(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getCommentsByPostId(postId));
    }

    @PostMapping
    public ResponseEntity<Comment> addComment(@PathVariable Long postId, @RequestBody Comment comment) {
        return new ResponseEntity<>(commentService.addComment(postId, comment), HttpStatus.CREATED);
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<Comment> updateComment(@PathVariable Long commentId, @RequestBody Comment comment) {
        return ResponseEntity.ok(commentService.updateComment(commentId, comment));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
