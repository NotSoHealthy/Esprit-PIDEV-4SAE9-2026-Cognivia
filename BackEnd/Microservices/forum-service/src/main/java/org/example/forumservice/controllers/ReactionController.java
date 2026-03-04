package org.example.forumservice.controllers;

import lombok.RequiredArgsConstructor;
import org.example.forumservice.entities.Reaction;
import org.example.forumservice.services.ReactionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts/{postId}/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @GetMapping
    public ResponseEntity<List<Reaction>> getReactionsByPostId(@PathVariable Long postId) {
        return ResponseEntity.ok(reactionService.getReactionsByPostId(postId));
    }

    @PostMapping
    public ResponseEntity<?> addReaction(@PathVariable Long postId, @RequestBody Reaction reaction) {
        try {
            return new ResponseEntity<>(reactionService.addReaction(postId, reaction), HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding reaction: " + e.getMessage());
        }
    }

    @DeleteMapping("/{reactionId}")
    public ResponseEntity<Void> deleteReaction(@PathVariable Long reactionId) {
        reactionService.deleteReaction(reactionId);
        return ResponseEntity.noContent().build();
    }
}
