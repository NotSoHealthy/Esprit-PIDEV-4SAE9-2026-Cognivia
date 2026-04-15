package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentPart;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentPartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentPartService {

    private final EquipmentPartRepository repository;

    public EquipmentPart save(EquipmentPart part) {
        return repository.save(part);
    }

    public List<EquipmentPart> getByEquipment(Long equipmentId) {
        return repository.findByEquipmentId(equipmentId);
    }

    public EquipmentPart update(EquipmentPart part) {
        if (repository.existsById(part.getId())) {
            return repository.save(part);
        } else {
            throw new RuntimeException("Equipment part not found");
        }
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
