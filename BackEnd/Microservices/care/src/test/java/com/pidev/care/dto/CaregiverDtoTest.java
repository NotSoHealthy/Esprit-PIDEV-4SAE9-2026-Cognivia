package com.pidev.care.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.pidev.care.entities.Caregiver;
import com.pidev.care.entities.CaregiverType;
import com.pidev.care.entities.Patient;
import com.pidev.care.entities.Visit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CaregiverDtoTest {

    @Test
    void fromCaregiver_mapsScalarFieldsAndLists() {
        Patient p1 = new Patient();
        p1.setId(1L);
        Patient p2 = new Patient();
        p2.setId(2L);
        Visit v1 = new Visit();
        v1.setId(10L);

        Caregiver caregiver = new Caregiver();
        caregiver.setId(99L);
        caregiver.setUserId(UUID.randomUUID());
        caregiver.setFirstName("A");
        caregiver.setLastName("B");
        caregiver.setType(CaregiverType.FAMILY);
        caregiver.setPatientList(List.of(p1, p2));
        caregiver.setVisitList(List.of(v1));

        CaregiverDto dto = CaregiverDto.fromCaregiver(caregiver);
        assertThat(dto.getId()).isEqualTo(99L);
        assertThat(dto.getType()).isEqualTo("FAMILY");
        assertThat(dto.getPatientIdList()).containsExactly(1L, 2L);
        assertThat(dto.getVisitIdList()).containsExactly(10L);
    }

    @Test
    void fromCaregiver_handlesNullCollectionsAndType() {
        Caregiver caregiver = new Caregiver();
        caregiver.setId(1L);
        caregiver.setType(null);
        caregiver.setPatientList(null);
        caregiver.setVisitList(null);

        CaregiverDto dto = CaregiverDto.fromCaregiver(caregiver);
        assertThat(dto.getType()).isNull();
        assertThat(dto.getPatientIdList()).isNull();
        assertThat(dto.getVisitIdList()).isNull();
    }
}
