package com.pidev.care.services;

import com.pidev.care.entities.Note;
import com.pidev.care.entities.Patient;
import com.pidev.care.repositories.NoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;

    @InjectMocks
    private NoteService noteService;

    @Test
    void getAll_delegates() {
        List<Note> notes = List.of(new Note());
        when(noteRepository.findAll()).thenReturn(notes);

        assertThat(noteService.getAll()).isSameAs(notes);
        verify(noteRepository).findAll();
    }

    @Test
    void getById_returnsNullWhenMissing() {
        when(noteRepository.findById(9L)).thenReturn(Optional.empty());

        assertThat(noteService.getById(9L)).isNull();
    }

    @Test
    void create_saves() {
        Note note = new Note();
        when(noteRepository.save(note)).thenReturn(note);

        assertThat(noteService.create(note)).isSameAs(note);
        verify(noteRepository).save(note);
    }

    @Test
    void update_throwsWhenMissing() {
        when(noteRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> noteService.update(1L, new Note()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Note not found");

        verify(noteRepository, never()).save(any());
    }

    @Test
    void update_updatesFieldsAndSaves() {
        Note existing = new Note();
        existing.setId(1L);
        existing.setTitle("Old");
        existing.setContent("Old content");

        Patient patient = new Patient();
        patient.setId(10L);

        Note patch = new Note();
        patch.setTitle("New");
        patch.setContent("New content");
        patch.setPatient(patient);

        when(noteRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(noteRepository.save(existing)).thenReturn(existing);

        Note saved = noteService.update(1L, patch);

        assertThat(saved).isSameAs(existing);
        assertThat(existing.getTitle()).isEqualTo("New");
        assertThat(existing.getContent()).isEqualTo("New content");
        assertThat(existing.getPatient()).isSameAs(patient);
        verify(noteRepository).save(existing);
    }

    @Test
    void delete_delegates() {
        noteService.delete(7L);
        verify(noteRepository).deleteById(7L);
    }
}
