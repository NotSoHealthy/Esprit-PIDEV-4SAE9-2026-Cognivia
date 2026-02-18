package com.esprit.microservice.surveillanceandequipment.Repositories;

import com.esprit.microservice.surveillanceandequipment.Entities.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
}
