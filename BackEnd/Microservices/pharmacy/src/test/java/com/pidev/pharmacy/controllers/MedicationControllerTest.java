package com.pidev.pharmacy.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationStatus;
import com.pidev.pharmacy.entities.TherapeuticClass;
import com.pidev.pharmacy.services.MedicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MedicationControllerTest {

	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Mock
	private MedicationService medicationService;

	@InjectMocks
	private MedicationController medicationController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(medicationController).build();
	}

	@Test
	void getAllMedications_shouldReturnList() throws Exception {
		Medication medication = buildMedication(1L);
		when(medicationService.getAll()).thenReturn(List.of(medication));

		mockMvc.perform(get("/medications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(1))
				.andExpect(jsonPath("$[0].name").value("Doliprane"));
	}

	@Test
	void uploadImage_shouldReturnBadRequestWhenFileEmpty() throws Exception {
		MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/png", new byte[0]);

		mockMvc.perform(multipart("/medications/3/upload-image").file(emptyFile))
				.andExpect(status().isBadRequest());
	}

	@Test
	void uploadImage_shouldReturnInternalServerErrorWhenIOException() throws Exception {
		MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", "data".getBytes());
		when(medicationService.uploadImage(eq(3L), any())).thenThrow(new IOException("upload failed"));

		mockMvc.perform(multipart("/medications/3/upload-image").file(file))
				.andExpect(status().isInternalServerError());
	}

	private Medication buildMedication(Long id) {
		Medication medication = new Medication();
		medication.setId(id);
		medication.setName("Doliprane");
		medication.setDescription("Pain relief");
		medication.setMedicationStatus(MedicationStatus.ACCEPTED);
		medication.setTherapeuticClass(TherapeuticClass.CHOLINESTERASE_INHIBITOR);
		return medication;
	}
}
