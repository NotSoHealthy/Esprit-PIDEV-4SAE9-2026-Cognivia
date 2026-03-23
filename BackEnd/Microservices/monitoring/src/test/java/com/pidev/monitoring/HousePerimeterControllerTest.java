package com.pidev.monitoring;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.monitoring.controllers.HousePerimeterController;
import com.pidev.monitoring.entities.HousePerimeter;
import com.pidev.monitoring.services.HousePerimeterService;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.Coordinate;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = HousePerimeterController.class)
class ousePerimeterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HousePerimeterService housePerimeterService;

    @Test
    void create_acceptsGeoJsonObjectPayload() throws Exception {
        // Given a valid polygon result from the service
        GeometryFactory gf = new GeometryFactory();
        Polygon poly = gf.createPolygon(new Coordinate[]{
                new Coordinate(10.161731, 36.847144),
                new Coordinate(10.162091, 36.847024),
                new Coordinate(10.162219, 36.847217),
                new Coordinate(10.161898, 36.847376),
                new Coordinate(10.161731, 36.847144)
        });

        HousePerimeter saved = new HousePerimeter();
        saved.setId(1L);
        saved.setPatientId(99L);
        saved.setGeom(poly);

        Mockito.when(housePerimeterService.create(Mockito.eq(99L), Mockito.anyString())).thenReturn(saved);

        // When/Then: posting your example payload as an OBJECT should be accepted
        String payload = "{\"type\":\"Polygon\",\"coordinates\":[[[10.161731,36.847144],[10.162091,36.847024],[10.162219,36.847217],[10.161898,36.847376],[10.161731,36.847144]]]}";

        mockMvc.perform(
                        post("/house-perimeters")
                                .queryParam("patientId", "99")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload)
                )
                .andExpect(status().isCreated());
    }
}
