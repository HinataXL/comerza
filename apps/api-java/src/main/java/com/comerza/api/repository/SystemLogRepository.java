package com.comerza.api.repository;

import com.comerza.api.entity.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, String> {
    
    // Al usar deleteBy, Spring Data JPA automáticamente genera un DELETE SQL
    // y devuelve la cantidad de registros eliminados.
    long deleteByCreatedAtBefore(LocalDateTime date);
}
