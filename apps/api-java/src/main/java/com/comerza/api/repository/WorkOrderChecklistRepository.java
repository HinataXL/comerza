package com.comerza.api.repository;

import com.comerza.api.entity.WorkOrderChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderChecklistRepository extends JpaRepository<WorkOrderChecklistItem, String> {
    List<WorkOrderChecklistItem> findByWorkOrderIdAndTenantId(String workOrderId, String tenantId);
    void deleteByWorkOrderIdAndTenantId(String workOrderId, String tenantId);
}
