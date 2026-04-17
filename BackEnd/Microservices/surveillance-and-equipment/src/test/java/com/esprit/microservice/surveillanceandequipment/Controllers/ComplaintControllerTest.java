package com.esprit.microservice.surveillanceandequipment.Controllers;

import com.esprit.microservice.surveillanceandequipment.Entities.Complaint;
import com.esprit.microservice.surveillanceandequipment.Entities.ComplaintStatus;
import com.esprit.microservice.surveillanceandequipment.Services.ComplaintService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ComplaintControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ComplaintService complaintService;

    @InjectMocks
    private ComplaintController complaintController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(complaintController).build();
    }

    @Test
    void getAllComplaints_shouldReturnList() throws Exception {
        Complaint complaint = new Complaint();
        complaint.setId(1L);
        complaint.setDescription("broken camera");

        when(complaintService.getAllComplaints()).thenReturn(List.of(complaint));

        mockMvc.perform(get("/complaint"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].description").value("broken camera"));
    }

    @Test
    void submitComplaint_shouldReturnSavedComplaint() throws Exception {
        Complaint request = new Complaint();
        request.setDescription("bad behavior");

        Complaint saved = new Complaint();
        saved.setId(2L);
        saved.setDescription("bad behavior");
        saved.setStatus(ComplaintStatus.SUBMITTED);

        when(complaintService.createComplaint(any(Complaint.class))).thenReturn(saved);

        mockMvc.perform(post("/complaint/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.status").value("SUBMITTED"));
    }

    @Test
    void validateComplaint_shouldThrowWhenStateIsInvalid() throws Exception {
        Complaint request = new Complaint();
        request.setStatus(ComplaintStatus.DISMISSED);

        when(complaintService.validateComplaint(any(Complaint.class)))
                .thenThrow(new IllegalStateException("Only SUBMITTED complaints can be validated"));

        Exception exception = assertThrows(
                Exception.class,
                () -> mockMvc.perform(put("/complaint/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
        );

        assertTrue(exception.getCause() instanceof IllegalStateException);

        verify(complaintService).validateComplaint(any(Complaint.class));
    }
}
