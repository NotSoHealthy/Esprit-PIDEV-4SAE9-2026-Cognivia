package com.pidev.pharmacy.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.pharmacy.dto.PharmacyUpdateInfoDTO;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.services.PharmacyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PharmacyControllerTest {

	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Mock
	private PharmacyService pharmacyService;

	@InjectMocks
	private PharmacyController pharmacyController;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(pharmacyController).build();
	}

	@Test
	void createPharmacy_shouldReturnCreatedEntity() throws Exception {
		Pharmacy pharmacy = buildPharmacy(2L);

		when(pharmacyService.create(any(Pharmacy.class))).thenReturn(pharmacy);

		mockMvc.perform(post("/pharmacies")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(buildPharmacy(null))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(2))
				.andExpect(jsonPath("$.name").value("City Pharmacy"));
	}

	@Test
	void uploadPharmacyImages_shouldReturnBadRequestWhenBothFilesMissing() throws Exception {
		mockMvc.perform(multipart("/pharmacies/5/upload-images"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void updatePharmacyInfo_shouldReturnNotFoundWhenServiceThrows() throws Exception {
		PharmacyUpdateInfoDTO dto = new PharmacyUpdateInfoDTO();
		dto.setName("Updated Name");
		dto.setDescription("Updated pharmacy description");
		dto.setContactInfo("12345678");

		when(pharmacyService.updatePharmacyInfo(any(), any())).thenThrow(new RuntimeException("not found"));

		mockMvc.perform(patch("/pharmacies/10/update-info")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isNotFound());
	}

	private Pharmacy buildPharmacy(Long id) {
		Pharmacy pharmacy = new Pharmacy();
		pharmacy.setId(id);
		pharmacy.setName("City Pharmacy");
		pharmacy.setAddress("Main street");
		pharmacy.setDescription("Trusted neighborhood pharmacy");
		pharmacy.setLatitude(36.80);
		pharmacy.setLongitude(10.18);
		pharmacy.setContactInfo("12345678");
		return pharmacy;
	}
}
