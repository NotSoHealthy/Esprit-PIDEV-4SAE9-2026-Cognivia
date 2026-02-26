package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Reservation;
import com.esprit.microservice.surveillanceandequipment.Entities.ReservationStatus;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.MaintenanceRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.ReservationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ReservationService {
    private final EquipmentRepository equipmentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final ReservationRepository reservationRepository;

    public Reservation createReservation(Reservation reservation) {
        return reservationRepository.save(reservation);
    }

    public List<Reservation> getReservationsByEquipmentId(Long equipmentId) {

        List<Reservation> reservations =
                reservationRepository.findByEquipmentId(equipmentId);

        LocalDateTime now = LocalDateTime.now();
        List<Reservation> toUpdate = new ArrayList<>();

        for (Reservation reservation : reservations) {

            if (reservation.getStatus() == ReservationStatus.SCHEDULED ||
                    reservation.getStatus() == ReservationStatus.ACTIVE) {

                // If reservation ended → RETURNED
                if (!reservation.getReturnDate().isAfter(now)) {
                    reservation.setStatus(ReservationStatus.RETURNED);
                    toUpdate.add(reservation);
                }

                // If reservation currently happening → ACTIVE
                else if (!reservation.getReservationDate().isAfter(now) &&
                        !reservation.getReturnDate().isBefore(now)) {

                    reservation.setStatus(ReservationStatus.ACTIVE);
                    toUpdate.add(reservation);
                }
            }
        }

        if (!toUpdate.isEmpty()) {
            reservationRepository.saveAll(toUpdate);
        }

        return reservations;
    }

    public Reservation getReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + id));
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public Reservation updateReservation(Reservation reservation) {
        return reservationRepository.save(reservation);
    }

    public void deleteReservation(Long id) {
        reservationRepository.deleteById(id);
    }



    public Optional<Reservation> checkOverlap(
            Long equipmentId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {

        List<Reservation> reservations =
                reservationRepository.findByEquipmentId(equipmentId);

        return reservations.stream()
                .filter(r ->
                        r.getReservationDate().isBefore(endDate) &&
                                r.getReturnDate().isAfter(startDate)
                )
                .findFirst();
    }
}
