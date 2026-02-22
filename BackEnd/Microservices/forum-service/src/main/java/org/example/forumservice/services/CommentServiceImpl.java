package org.example.forumservice.services;

import org.example.forumservice.entities.Comment;
import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.CommentRepository;
import org.example.forumservice.repositories.PostRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserLookupService userLookupService;

    public CommentServiceImpl(CommentRepository commentRepository, PostRepository postRepository,
            UserLookupService userLookupService) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userLookupService = userLookupService;
    }

    @Override
    public List<Comment> getCommentsByPostId(Long postId) {
        List<Comment> comments = commentRepository.findByPostId(postId);
        comments.forEach(this::enrichWithAuthorInfo);
        return comments;
    }

    @Override
    public Comment getCommentById(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));
        enrichWithAuthorInfo(comment);
        return comment;
    }

    @Override
    public Comment addComment(Long postId, Comment comment) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        comment.setPost(post);
        // Ensure the ID is null so that Hibernate treats it as a new entity
        comment.setId(null);
        return commentRepository.save(comment);
    }

    @Override
    public Comment updateComment(Long id, Comment comment) {
        Comment existing = getCommentById(id);
        existing.setContent(comment.getContent());
        return commentRepository.save(existing);
    }

    @Override
    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }

    private void enrichWithAuthorInfo(Comment comment) {
        userLookupService.lookupUser(comment.getUserId()).ifPresent(profile -> {
            comment.setAuthorFullName(profile.fullName);
            comment.setAuthorRole(profile.role);
        });
    }
}
