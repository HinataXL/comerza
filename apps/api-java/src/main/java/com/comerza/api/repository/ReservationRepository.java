package com.comerza.api.repository;

import com.comerza.api.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, String> {
    List<Reservation> findByTenantIdOrderByStartTimeDesc(String tenantId);
    Optional<Reservation> findByActionToken(String actionToken);
}
