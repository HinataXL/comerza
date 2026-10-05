package com.comerza.api.repository;

import com.comerza.api.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, String> {
    List<WorkOrder> findByTenantId(String tenantId);
    Optional<WorkOrder> findByIdAndTenantId(String id, String tenantId);
    boolean existsByWorkOrderNumberAndTenantId(String workOrderNumber, String tenantId);
}
