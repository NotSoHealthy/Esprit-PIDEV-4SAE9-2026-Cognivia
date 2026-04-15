package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.JournalEntry;
import com.pidev.monitoring.repositories.JournalEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JournalEntryServiceTest {

    @Mock
    private JournalEntryRepository journalEntryRepository;

    @InjectMocks
    private JournalEntryService journalEntryService;

    private JournalEntry testEntry;

    @BeforeEach
    void setUp() {
        testEntry = new JournalEntry();
        testEntry.setId(1L);
        testEntry.setPatientId(100L);
        testEntry.setTitle("Test Title");
        testEntry.setContent("Test Content");
    }

    @Test
    void testGetAll() {
        when(journalEntryRepository.findAll()).thenReturn(Collections.singletonList(testEntry));
        List<JournalEntry> results = journalEntryService.getAll();
        assertEquals(1, results.size());
        verify(journalEntryRepository).findAll();
    }

    @Test
    void testGetById() {
        when(journalEntryRepository.findById(1L)).thenReturn(Optional.of(testEntry));
        JournalEntry result = journalEntryService.getById(1L);
        assertNotNull(result);
        assertEquals("Test Title", result.getTitle());
    }

    @Test
    void testCreate() {
        when(journalEntryRepository.save(any(JournalEntry.class))).thenReturn(testEntry);
        JournalEntry result = journalEntryService.create(testEntry);
        assertNotNull(result);
        verify(journalEntryRepository).save(testEntry);
    }

    @Test
    void testUpdate_Success() {
        JournalEntry updateInfo = new JournalEntry();
        updateInfo.setTitle("New Title");
        updateInfo.setContent("New Content");

        when(journalEntryRepository.findById(1L)).thenReturn(Optional.of(testEntry));
        when(journalEntryRepository.save(any(JournalEntry.class))).thenReturn(testEntry);

        JournalEntry result = journalEntryService.update(1L, updateInfo);

        assertNotNull(result);
        assertEquals("New Title", testEntry.getTitle());
        verify(journalEntryRepository).save(testEntry);
    }

    @Test
    void testGetByPatientId() {
        when(journalEntryRepository.findByPatientId(100L)).thenReturn(Collections.singletonList(testEntry));
        List<JournalEntry> results = journalEntryService.getByPatientId(100L);
        assertEquals(1, results.size());
        verify(journalEntryRepository).findByPatientId(100L);
    }

    @Test
    void testDelete() {
        journalEntryService.delete(1L);
        verify(journalEntryRepository).deleteById(1L);
    }
}
