package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.JournalEntry;
import com.pidev.monitoring.services.JournalEntryService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JournalEntryControllerTest {

    @Mock
    private JournalEntryService service;

    private JournalEntryController controller;

    @BeforeEach
    void setUp() {
        controller = new JournalEntryController(service);
    }

    @Test
    void getAllJournalEntries_delegates() {
        List<JournalEntry> list = List.of(new JournalEntry());
        when(service.getAll()).thenReturn(list);
        assertSame(list, controller.getAllJournalEntries());
    }

    @Test
    void getJournalEntryById_delegates() {
        JournalEntry entry = new JournalEntry();
        when(service.getById(1L)).thenReturn(entry);
        assertSame(entry, controller.getJournalEntryById(1L));
    }

    @Test
    void getJournalEntriesByPatientId_delegates() {
        List<JournalEntry> list = List.of(new JournalEntry());
        when(service.getByPatientId(5L)).thenReturn(list);
        assertSame(list, controller.getJournalEntriesByPatientId(5L));
    }

    @Test
    void createJournalEntry_delegates() {
        JournalEntry input = new JournalEntry();
        JournalEntry created = new JournalEntry();
        when(service.create(input)).thenReturn(created);
        assertSame(created, controller.createJournalEntry(input));
    }

    @Test
    void updateJournalEntry_delegates() {
        JournalEntry patch = new JournalEntry();
        JournalEntry updated = new JournalEntry();
        when(service.update(2L, patch)).thenReturn(updated);
        assertSame(updated, controller.updateJournalEntry(2L, patch));
    }

    @Test
    void deleteJournalEntry_delegates() {
        controller.deleteJournalEntry(3L);
        verify(service).delete(3L);
    }
}
