package com.comerza.api.repository;

import com.comerza.api.entity.WorkOrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderStatusHistoryRepository extends JpaRepository<WorkOrderStatusHistory, String> {
    List<WorkOrderStatusHistory> findByWorkOrderIdAndTenantIdOrderByCreatedAtDesc(String workOrderId, String tenantId);
    List<WorkOrderStatusHistory> findByWorkOrderIdOrderByCreatedAtAsc(String workOrderId);
}
