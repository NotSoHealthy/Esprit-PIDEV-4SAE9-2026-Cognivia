package org.example.forumservice.services;

import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.PostRepository;

import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final org.example.forumservice.repositories.ReactionRepository reactionRepository;
    private final org.example.forumservice.repositories.PinnedPostRepository pinnedPostRepository;
    private final org.example.forumservice.repositories.ReportRepository reportRepository;
    private final UserLookupService userLookupService;

    public PostServiceImpl(PostRepository postRepository,
            org.example.forumservice.repositories.ReactionRepository reactionRepository,
            org.example.forumservice.repositories.PinnedPostRepository pinnedPostRepository,
            org.example.forumservice.repositories.ReportRepository reportRepository,
            UserLookupService userLookupService) {
        this.postRepository = postRepository;
        this.reactionRepository = reactionRepository;
        this.pinnedPostRepository = pinnedPostRepository;
        this.reportRepository = reportRepository;
        this.userLookupService = userLookupService;
    }

    @Override
    public List<Post> getAllPosts(String userId) {
        List<Post> posts = postRepository.findAll();
        return posts.stream()
                .filter(post -> !post.isBanned())
                .peek(post -> {
                    populateCounts(post);
                    enrichWithAuthorInfo(post);
                    if (userId != null) {
                        post.setPinned(pinnedPostRepository.findByPostAndUserId(post, userId).isPresent());
                    }
                })
                .sorted(Comparator.comparing(Post::isPinned).reversed()
                        .thenComparing(Comparator.comparing(Post::getCreatedAt).reversed()))
                .collect(Collectors.toList());
    }

    @Override
    public Post getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        if (post.isBanned()) {
            throw new RuntimeException("This post has been suspended due to community reports.");
        }

        populateCounts(post);
        enrichWithAuthorInfo(post);
        return post;
    }

    private void enrichWithAuthorInfo(Post post) {
        userLookupService.lookupUser(post.getUserId()).ifPresent(profile -> {
            post.setAuthorFullName(profile.fullName);
            post.setAuthorRole(profile.role);
        });
    }

    private void populateCounts(Post post) {
        post.setLikeCount(reactionRepository.countByPost_IdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.LIKE));
        post.setDislikeCount(reactionRepository.countByPost_IdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.DISLIKE));
        post.setLoveCount(reactionRepository.countByPost_IdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.LOVE));
        post.setHahaCount(reactionRepository.countByPost_IdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.HAHA));
        post.setWowCount(reactionRepository.countByPost_IdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.WOW));
        post.setSadCount(reactionRepository.countByPost_IdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.SAD));
        post.setAngryCount(reactionRepository.countByPost_IdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.ANGRY));
    }

    @Override
    public Post createPost(Post post) {
        // Ensure the ID is null so that Hibernate treats it as a new entity
        post.setId(null);
        post.setBanned(false);
        return postRepository.save(post);
    }

    @Override
    public Post updatePost(Long id, Post post) {
        Post existing = getPostById(id);
        existing.setTitle(post.getTitle());
        existing.setContent(post.getContent());
        existing.setCategory(post.getCategory());
        return postRepository.save(existing);
    }

    @Override
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    @Override
    public Post togglePin(Long id, String userId) {
        Post post = getPostById(id);
        java.util.Optional<org.example.forumservice.entities.PinnedPost> existing = pinnedPostRepository
                .findByPostAndUserId(post, userId);

        if (existing.isPresent()) {
            pinnedPostRepository.delete(existing.get());
            post.setPinned(false);
        } else {
            org.example.forumservice.entities.PinnedPost pinnedPost = new org.example.forumservice.entities.PinnedPost();
            pinnedPost.setPost(post);
            pinnedPost.setUserId(userId);
            pinnedPostRepository.save(pinnedPost);
            post.setPinned(true);
        }
        return post;
    }

    @Override
    public void reportPost(Long postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.getUserId() != null && post.getUserId().equals(userId)) {
            throw new RuntimeException("You cannot report your own post.");
        }

        if (reportRepository.existsByPost_IdAndUserId(postId, userId)) {
            return; // Already reported by this user
        }

        org.example.forumservice.entities.Report report = new org.example.forumservice.entities.Report();
        report.setPost(post);
        report.setUserId(userId);
        reportRepository.save(report);

        long reportCount = reportRepository.countByPost_Id(postId);
        if (reportCount >= 2) {
            post.setBanned(true);
            postRepository.save(post);
        }
    }
}
