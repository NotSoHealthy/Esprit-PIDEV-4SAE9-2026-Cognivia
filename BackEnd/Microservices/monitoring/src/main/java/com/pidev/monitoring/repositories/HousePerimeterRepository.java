package com.pidev.monitoring.repositories;

import com.pidev.monitoring.entities.HousePerimeter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HousePerimeterRepository extends JpaRepository<HousePerimeter, Long> {

    // ✅ Pass point as EWKT string e.g. "SRID=4326;POINT(10.16 36.81)"
    // ST_GeomFromEWKT parses the text — no binary binding issues
    @Query(value = "SELECT EXISTS (" +
            "  SELECT 1 FROM house_perimeter hp " +
            "  WHERE ST_Contains(hp.geom, ST_GeomFromEWKT(:pointEwkt))" +
            ")", nativeQuery = true)
    boolean existsContainingPoint(@Param("pointEwkt") String pointEwkt);

    Optional<HousePerimeter> findByPatientId(Long patientId);
}