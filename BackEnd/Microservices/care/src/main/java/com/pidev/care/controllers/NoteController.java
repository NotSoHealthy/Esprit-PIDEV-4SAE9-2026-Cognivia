package com.pidev.care.controllers;

import com.pidev.care.entities.Note;
import com.pidev.care.services.NoteService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/note")
@AllArgsConstructor
public class NoteController {
    private final NoteService noteService;

    @GetMapping
    public List<Note> getAllNotes() {
        return noteService.getAll();
    }

    @GetMapping("/{id}")
    public Note getNoteById(@PathVariable Long id) {
        return noteService.getById(id);
    }

    @PostMapping
    public Note createNote(@RequestBody Note note) {
        return noteService.create(note);
    }

    @PutMapping("/{id}")
    public Note updateNote(@PathVariable Long id, @RequestBody Note note) {
        return noteService.update(id, note);
    }

    @DeleteMapping("/{id}")
    public void deleteNote(@PathVariable Long id) {
        noteService.delete(id);
    }
}
