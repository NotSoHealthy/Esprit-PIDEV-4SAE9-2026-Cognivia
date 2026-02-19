    package org.example.forumservice.controllers;

    import org.example.forumservice.entities.Post;
    import org.example.forumservice.services.PostService;

    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;

    @RestController
    @RequestMapping("/posts")
    public class PostController {

        private final PostService postService;

        public PostController(PostService postService) {
            this.postService = postService;
        }

        @GetMapping
        public ResponseEntity<List<Post>> getAllPosts() {
            return ResponseEntity.ok(postService.getAllPosts());
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
    }
