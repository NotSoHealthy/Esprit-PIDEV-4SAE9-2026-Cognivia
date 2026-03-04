package org.example.forumservice.services;

import org.example.forumservice.entities.Comment;

import java.util.List;

public interface CommentService {
    List<Comment> getCommentsByPostId(Long postId);
    Comment getCommentById(Long id);
    Comment addComment(Long postId, Comment comment);
    Comment updateComment(Long id, Comment comment);
    void deleteComment(Long id);
}
