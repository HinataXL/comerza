package com.comerza.api.service;

import com.comerza.api.enums.WorkOrderStatus;
import com.comerza.api.entity.User;
import com.comerza.api.entity.WorkOrder;
import com.comerza.api.entity.WorkOrderStatusHistory;
import com.comerza.api.repository.WorkOrderRepository;
import com.comerza.api.repository.WorkOrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class WorkOrderStatusService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;
    private final org.springframework.context.ApplicationContext applicationContext;

    @Transactional
    public WorkOrder changeStatus(String workOrderId, String tenantId, WorkOrderStatus newStatus, User changedBy) {
        WorkOrder workOrder = workOrderRepository.findByIdAndTenantId(workOrderId, tenantId)
                .orElseThrow(() -> new RuntimeException("WorkOrder not found"));

        WorkOrderStatus previousStatus = workOrder.getStatus();

        if (previousStatus == newStatus) {
            return workOrder;
        }

        validateTransition(previousStatus, newStatus);

        workOrder.setStatus(newStatus);
        
        // Update specific timestamps and snapshots based on status
        if (previousStatus == WorkOrderStatus.WAITING_APPROVAL && newStatus == WorkOrderStatus.IN_REPAIR) {
            workOrder.setApprovedAt(java.time.LocalDateTime.now());
            workOrder.setApprovalMethod("IN_PERSON");
            workOrder.setApprovedSubtotal(workOrder.getSubtotal());
            workOrder.setApprovedDiscount(workOrder.getDiscount());
            workOrder.setApprovedTax(workOrder.getTax());
            workOrder.setApprovedTotal(workOrder.getTotal());
            // Create Sale and deduct inventory automatically
            applicationContext.getBean(WorkOrderService.class).createSaleFromWorkOrder(workOrderId, tenantId, changedBy);
            // Optionally approvedByUserId = changedBy.getId() if added to entity, for now just history tracks who did it
        } else if (newStatus == WorkOrderStatus.READY) {
            workOrder.setCompletedAt(java.time.LocalDateTime.now());
        } else if (newStatus == WorkOrderStatus.DELIVERED) {
            workOrder.setDeliveredAt(java.time.LocalDateTime.now());
        }

        workOrder = workOrderRepository.save(workOrder);

        WorkOrderStatusHistory history = WorkOrderStatusHistory.builder()
                .tenant(workOrder.getTenant())
                .workOrder(workOrder)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .build();
        
        historyRepository.save(history);

        // TODO: Register SystemLog

        return workOrder;
    }

    private void validateTransition(WorkOrderStatus current, WorkOrderStatus next) {
        // Implementation of valid state transitions
        if (next == WorkOrderStatus.CANCELLED) {
            if (current == WorkOrderStatus.DELIVERED || current == WorkOrderStatus.READY) {
                throw new RuntimeException("Cannot cancel a completed work order");
            }
            return;
        }

        boolean isValid = switch (current) {
            case RECEIVED -> Arrays.asList(WorkOrderStatus.DIAGNOSIS, WorkOrderStatus.WAITING_APPROVAL, WorkOrderStatus.IN_REPAIR).contains(next);
            case DIAGNOSIS -> Arrays.asList(WorkOrderStatus.WAITING_APPROVAL, WorkOrderStatus.IN_REPAIR).contains(next);
            case WAITING_APPROVAL -> Arrays.asList(WorkOrderStatus.APPROVED, WorkOrderStatus.IN_REPAIR).contains(next); // in case they approve in person
            case APPROVED -> Arrays.asList(WorkOrderStatus.IN_REPAIR).contains(next);
            case IN_REPAIR -> Arrays.asList(WorkOrderStatus.QUALITY_CONTROL, WorkOrderStatus.READY).contains(next);
            case QUALITY_CONTROL -> Arrays.asList(WorkOrderStatus.READY, WorkOrderStatus.IN_REPAIR).contains(next);
            case READY -> Arrays.asList(WorkOrderStatus.DELIVERED).contains(next);
            case DELIVERED, CANCELLED -> false;
        };

        if (!isValid) {
            throw new RuntimeException("Invalid status transition from " + current + " to " + next);
        }
    }
}
