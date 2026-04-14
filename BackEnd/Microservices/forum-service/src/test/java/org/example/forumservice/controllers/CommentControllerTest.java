package org.example.forumservice.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.forumservice.entities.Comment;
import org.example.forumservice.services.CommentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommentController.class)
public class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CommentService commentService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetCommentsByPostId() throws Exception {
        when(commentService.getCommentsByPostId(anyLong())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/posts/1/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testAddComment() throws Exception {
        Comment comment = new Comment();
        comment.setContent("Nice post!");

        when(commentService.addComment(anyLong(), any(Comment.class))).thenReturn(comment);

        mockMvc.perform(post("/posts/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(comment)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Nice post!"));
    }

    @Test
    void testUpdateComment() throws Exception {
        Comment comment = new Comment();
        comment.setContent("Updated comment");

        when(commentService.updateComment(anyLong(), any(Comment.class))).thenReturn(comment);

        mockMvc.perform(put("/posts/1/comments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(comment)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Updated comment"));
    }

    @Test
    void testDeleteComment() throws Exception {
        mockMvc.perform(delete("/posts/1/comments/1"))
                .andExpect(status().isNoContent());
    }
}
