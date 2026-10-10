package com.comerza.api.repository;

import com.comerza.api.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, String> {
    List<WorkOrder> findByTenantId(String tenantId);
    Optional<WorkOrder> findByIdAndTenantId(String id, String tenantId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WorkOrder w where w.id = :id and w.tenant.id = :tenantId")
    Optional<WorkOrder> findForUpdate(@Param("id") String id, @Param("tenantId") String tenantId);
    boolean existsByWorkOrderNumberAndTenantId(String workOrderNumber, String tenantId);
}
