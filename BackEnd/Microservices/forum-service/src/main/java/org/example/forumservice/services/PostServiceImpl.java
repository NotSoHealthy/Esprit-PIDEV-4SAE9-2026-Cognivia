package org.example.forumservice.services;

import lombok.RequiredArgsConstructor;
import org.example.forumservice.entities.Post;
import org.example.forumservice.entities.ReactionType;
import org.example.forumservice.repositories.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final ReactionRepository reactionRepository;
    private final PinnedPostRepository pinnedPostRepository;
    private final CommentRepository commentRepository;
    private final ReportRepository reportRepository;
    private final UserLookupService userLookupService;

    @Override
    public List<Post> getAllPosts(String userId) {
        Page<Post> postPage = getPosts(userId, "all", 0, Integer.MAX_VALUE);
        return postPage.getContent();
    }

    @Override
    public Page<Post> getPosts(String userId, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage;

        if (category == null || category.equalsIgnoreCase("all")) {
            postPage = postRepository.findAllWithPinnedFirst(userId, pageable);
        } else {
            postPage = postRepository.findByCategoryWithPinnedFirst(userId, category, pageable);
        }

        if (postPage.isEmpty()) {
            return postPage;
        }

        enrichPosts(postPage.getContent(), userId);

        return postPage;
    }

    private void enrichPosts(List<Post> posts, String userId) {
        if (posts.isEmpty())
            return;

        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());

        // Batch fetch reaction counts
        List<Object[]> reactionCounts = reactionRepository.countReactionsForPosts(postIds);
        Map<Long, Map<ReactionType, Long>> countsByPost = new HashMap<>();
        for (Object[] row : reactionCounts) {
            Long postId = (Long) row[0];
            ReactionType type = (ReactionType) row[1];
            Long count = (Long) row[2];
            countsByPost.computeIfAbsent(postId, k -> new HashMap<>()).put(type, count);
        }

        // Batch fetch comment counts
        List<Object[]> commentCounts = commentRepository.countCommentsForPosts(postIds);
        Map<Long, Long> commentCountsByPost = new HashMap<>();
        for (Object[] row : commentCounts) {
            commentCountsByPost.put((Long) row[0], (Long) row[1]);
        }

        // Batch fetch pinned status
        Set<Long> pinnedPostIds = new HashSet<>();
        Map<Long, ReactionType> userReactionsByPost = new HashMap<>();

        if (userId != null) {
            pinnedPostIds = pinnedPostRepository.findByUserId(userId).stream()
                    .map(pp -> pp.getPost().getId())
                    .collect(Collectors.toSet());

            List<Object[]> userReactions = reactionRepository.findUserReactionsForPosts(userId, postIds);
            for (Object[] row : userReactions) {
                userReactionsByPost.put((Long) row[0], (ReactionType) row[1]);
            }
        }

        for (Post post : posts) {
            Map<ReactionType, Long> counts = countsByPost.getOrDefault(post.getId(), Collections.emptyMap());
            post.setLikeCount(counts.getOrDefault(ReactionType.LIKE, 0L));
            post.setDislikeCount(counts.getOrDefault(ReactionType.DISLIKE, 0L));
            post.setLoveCount(counts.getOrDefault(ReactionType.LOVE, 0L));
            post.setHahaCount(counts.getOrDefault(ReactionType.HAHA, 0L));
            post.setWowCount(counts.getOrDefault(ReactionType.WOW, 0L));
            post.setSadCount(counts.getOrDefault(ReactionType.SAD, 0L));
            post.setAngryCount(counts.getOrDefault(ReactionType.ANGRY, 0L));

            post.setCommentCount(commentCountsByPost.getOrDefault(post.getId(), 0L));
            post.setUserReaction(userReactionsByPost.get(post.getId()));

            enrichWithAuthorInfo(post);
            post.setPinned(pinnedPostIds.contains(post.getId()));
        }
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
        post.setLikeCount(reactionRepository.countByPost_IdAndType(post.getId(), ReactionType.LIKE));
        post.setDislikeCount(reactionRepository.countByPost_IdAndType(post.getId(), ReactionType.DISLIKE));
        post.setLoveCount(reactionRepository.countByPost_IdAndType(post.getId(), ReactionType.LOVE));
        post.setHahaCount(reactionRepository.countByPost_IdAndType(post.getId(), ReactionType.HAHA));
        post.setWowCount(reactionRepository.countByPost_IdAndType(post.getId(), ReactionType.WOW));
        post.setSadCount(reactionRepository.countByPost_IdAndType(post.getId(), ReactionType.SAD));
        post.setAngryCount(reactionRepository.countByPost_IdAndType(post.getId(), ReactionType.ANGRY));

        post.setCommentCount(commentRepository.findByPostId(post.getId()).size());
    }

    @Override
    public Post createPost(Post post) {
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
        Optional<org.example.forumservice.entities.PinnedPost> existing = pinnedPostRepository
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
            return;
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
