package com.pidev.care.services;

import com.pidev.care.entities.Note;
import com.pidev.care.repositories.NoteRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@AllArgsConstructor
public class NoteService implements IService<Note> {
    private final NoteRepository noteRepository;

    @Override
    public List<Note> getAll() {
        return noteRepository.findAll();
    }

    @Override
    public Note getById(Long id) {
        return noteRepository.findById(id).orElse(null);
    }

    @Override
    public Note create(Note entity) {
        return noteRepository.save(entity);
    }

    @Override
    public Note update(Long id, Note entity) {
        Note existing = noteRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Note not found");
        }

        existing.setTitle(entity.getTitle());
        existing.setContent(entity.getContent());
        existing.setPatient(entity.getPatient());

        return noteRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        noteRepository.deleteById(id);
    }
}
