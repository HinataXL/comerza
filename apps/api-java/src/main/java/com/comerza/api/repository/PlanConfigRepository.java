package com.comerza.api.repository;

import com.comerza.api.entity.PlanConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanConfigRepository extends JpaRepository<PlanConfig, String> {
    Optional<PlanConfig> findByName(String name);
}
