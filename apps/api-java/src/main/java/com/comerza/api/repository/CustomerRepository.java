package com.comerza.api.repository;

import com.comerza.api.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    List<Customer> findByTenantId(String tenantId);
    Optional<Customer> findByIdAndTenantId(String id, String tenantId);
}
