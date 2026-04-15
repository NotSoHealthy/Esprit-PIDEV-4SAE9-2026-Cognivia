package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pidev.care.entities.EmergencyContact;
import com.pidev.care.services.EmergencyContactService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EmergencyContactControllerTest {

    @Mock
    private EmergencyContactService emergencyContactService;

    private EmergencyContactController controller;

    @BeforeEach
    void setUp() {
        controller = new EmergencyContactController(emergencyContactService);
    }

    @Test
    void getAllEmergencyContacts_delegatesToService() {
        List<EmergencyContact> contacts = List.of(new EmergencyContact());
        when(emergencyContactService.getAll()).thenReturn(contacts);

        assertThat(controller.getAllEmergencyContacts()).isSameAs(contacts);
    }

    @Test
    void getEmergencyContactById_delegatesToService() {
        EmergencyContact contact = new EmergencyContact();
        when(emergencyContactService.getById(1L)).thenReturn(contact);

        assertThat(controller.getEmergencyContactById(1L)).isSameAs(contact);
    }

    @Test
    void createEmergencyContact_delegatesToService() {
        EmergencyContact input = new EmergencyContact();
        EmergencyContact created = new EmergencyContact();
        when(emergencyContactService.create(input)).thenReturn(created);

        assertThat(controller.createEmergencyContact(input)).isSameAs(created);
    }

    @Test
    void updateEmergencyContact_delegatesToService() {
        EmergencyContact patch = new EmergencyContact();
        EmergencyContact updated = new EmergencyContact();
        when(emergencyContactService.update(2L, patch)).thenReturn(updated);

        assertThat(controller.updateEmergencyContact(2L, patch)).isSameAs(updated);
    }

    @Test
    void deleteEmergencyContact_delegatesToService() {
        controller.deleteEmergencyContact(3L);
        verify(emergencyContactService).delete(3L);
    }
}
