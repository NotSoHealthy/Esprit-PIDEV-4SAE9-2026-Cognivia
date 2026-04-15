package com.pidev.care.services;

import com.pidev.care.entities.EmergencyContact;
import com.pidev.care.repositories.EmergencyContactRepository;
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
class EmergencyContactServiceTest {

    @Mock
    private EmergencyContactRepository repository;

    @InjectMocks
    private EmergencyContactService service;

    @Test
    void getAll_delegates() {
        List<EmergencyContact> list = List.of(new EmergencyContact());
        when(repository.findAll()).thenReturn(list);

        assertThat(service.getAll()).isSameAs(list);
        verify(repository).findAll();
    }

    @Test
    void getById_returnsNullWhenMissing() {
        when(repository.findById(9L)).thenReturn(Optional.empty());

        assertThat(service.getById(9L)).isNull();
    }

    @Test
    void create_saves() {
        EmergencyContact c = new EmergencyContact();
        when(repository.save(c)).thenReturn(c);

        assertThat(service.create(c)).isSameAs(c);
        verify(repository).save(c);
    }

    @Test
    void update_throwsWhenMissing() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(1L, new EmergencyContact()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Emergency contact not found");

        verify(repository, never()).save(any());
    }

    @Test
    void update_updatesFieldsAndSaves() {
        EmergencyContact existing = new EmergencyContact();
        existing.setId(1L);
        existing.setFirstName("A");
        existing.setLastName("B");
        existing.setEmail("a@b.com");
        existing.setPhoneNumber("1");
        existing.setRelation("old");

        EmergencyContact patch = new EmergencyContact();
        patch.setFirstName("NewA");
        patch.setLastName("NewB");
        patch.setEmail("new@b.com");
        patch.setPhoneNumber("2");
        patch.setRelation("new");

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        EmergencyContact saved = service.update(1L, patch);

        assertThat(saved).isSameAs(existing);
        assertThat(existing.getFirstName()).isEqualTo("NewA");
        assertThat(existing.getLastName()).isEqualTo("NewB");
        assertThat(existing.getEmail()).isEqualTo("new@b.com");
        assertThat(existing.getPhoneNumber()).isEqualTo("2");
        assertThat(existing.getRelation()).isEqualTo("new");
        verify(repository).save(existing);
    }

    @Test
    void delete_delegates() {
        service.delete(7L);
        verify(repository).deleteById(7L);
    }
}
