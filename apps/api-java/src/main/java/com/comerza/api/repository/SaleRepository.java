package com.comerza.api.repository;

import com.comerza.api.entity.Sale;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, String> {
    
    // By default, this will fetch just the Sale. 
    List<Sale> findByTenantId(String tenantId);
    
    // We can use EntityGraph to replicate Prisma's "include: { customer: true, items: true }"
    @EntityGraph(attributePaths = {"customer", "tenant", "items", "items.product"})
    Optional<Sale> findByIdAndTenantId(String id, String tenantId);

    @EntityGraph(attributePaths = {"customer", "tenant", "items", "items.product"})
    Optional<Sale> findById(String id);
}
