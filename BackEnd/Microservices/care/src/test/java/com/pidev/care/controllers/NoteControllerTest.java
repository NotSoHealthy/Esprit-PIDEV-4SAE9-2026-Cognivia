package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pidev.care.entities.Note;
import com.pidev.care.services.NoteService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NoteControllerTest {

    @Mock
    private NoteService noteService;

    private NoteController controller;

    @BeforeEach
    void setUp() {
        controller = new NoteController(noteService);
    }

    @Test
    void getAllNotes_delegatesToService() {
        List<Note> notes = List.of(new Note());
        when(noteService.getAll()).thenReturn(notes);

        assertThat(controller.getAllNotes()).isSameAs(notes);
    }

    @Test
    void getNoteById_delegatesToService() {
        Note note = new Note();
        when(noteService.getById(1L)).thenReturn(note);

        assertThat(controller.getNoteById(1L)).isSameAs(note);
    }

    @Test
    void createNote_delegatesToService() {
        Note input = new Note();
        Note created = new Note();
        when(noteService.create(input)).thenReturn(created);

        assertThat(controller.createNote(input)).isSameAs(created);
    }

    @Test
    void updateNote_delegatesToService() {
        Note patch = new Note();
        Note updated = new Note();
        when(noteService.update(2L, patch)).thenReturn(updated);

        assertThat(controller.updateNote(2L, patch)).isSameAs(updated);
    }

    @Test
    void deleteNote_delegatesToService() {
        controller.deleteNote(3L);
        verify(noteService).delete(3L);
    }
}
