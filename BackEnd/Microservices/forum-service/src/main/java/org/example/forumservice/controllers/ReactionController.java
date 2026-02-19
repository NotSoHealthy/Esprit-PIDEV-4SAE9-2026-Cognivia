package org.example.forumservice.controllers;

import org.example.forumservice.entities.Reaction;
import org.example.forumservice.services.ReactionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts/{postId}/reactions")
public class ReactionController {

    private final ReactionService reactionService;

    public ReactionController(ReactionService reactionService) {
        this.reactionService = reactionService;
    }

    @GetMapping
    public ResponseEntity<List<Reaction>> getReactionsByPostId(@PathVariable Long postId) {
        return ResponseEntity.ok(reactionService.getReactionsByPostId(postId));
    }

    @PostMapping
    public ResponseEntity<Reaction> addReaction(@PathVariable Long postId, @RequestBody Reaction reaction) {
        return new ResponseEntity<>(reactionService.addReaction(postId, reaction), HttpStatus.CREATED);
    }

    @DeleteMapping("/{reactionId}")
    public ResponseEntity<Void> deleteReaction(@PathVariable Long reactionId) {
        reactionService.deleteReaction(reactionId);
        return ResponseEntity.noContent().build();
    }
}
