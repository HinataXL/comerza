package com.comerza.api.repository;

import com.comerza.api.entity.WorkOrderPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderPhotoRepository extends JpaRepository<WorkOrderPhoto, String> {
    List<WorkOrderPhoto> findByWorkOrderIdAndTenantIdOrderByCreatedAtDesc(String workOrderId, String tenantId);
    Optional<WorkOrderPhoto> findByIdAndTenantId(String id, String tenantId);
}
