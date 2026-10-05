package com.comerza.api.repository;

import com.comerza.api.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByTenantId(String tenantId);
    Optional<Product> findByIdAndTenantId(String id, String tenantId);
}
