package org.example.forumservice.services;

import lombok.RequiredArgsConstructor;
import org.example.forumservice.entities.Comment;
import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.CommentRepository;
import org.example.forumservice.repositories.PostRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserLookupService userLookupService;
    private final BadWordFilterService badWordFilterService;

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
        badWordFilterService.validateText(comment.getContent());
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        comment.setPost(post);
        comment.setId(null);
        return commentRepository.save(comment);
    }

    @Override
    public Comment updateComment(Long id, Comment comment) {
        badWordFilterService.validateText(comment.getContent());
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
