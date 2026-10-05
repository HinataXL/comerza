package com.comerza.api.service;

import com.comerza.api.dto.*;
import com.comerza.api.entity.PublicToken;
import com.comerza.api.entity.WorkOrder;
import com.comerza.api.entity.WorkOrderStatusHistory;
import com.comerza.api.enums.PublicTokenType;
import com.comerza.api.enums.WorkOrderStatus;
import com.comerza.api.repository.WorkOrderRepository;
import com.comerza.api.repository.WorkOrderStatusHistoryRepository;
// Removed JsonProcessingException
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicTallerService {

    private final PublicTokenService publicTokenService;
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;
    private final org.springframework.context.ApplicationContext applicationContext;

    @Transactional(readOnly = true)
    public PublicApprovalDTO getApprovalDetails(String token) {
        PublicToken publicToken = publicTokenService.validateToken(token, PublicTokenType.APPROVAL);
        WorkOrder order = publicToken.getWorkOrder();

        List<PublicApprovalItemDTO> items = order.getItems().stream()
                .map(item -> PublicApprovalItemDTO.builder()
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .discount(item.getDiscount())
                        .subtotal(item.getSubtotal())
                        .type(item.getItemType().name())
                        .build())
                .collect(Collectors.toList());

        return PublicApprovalDTO.builder()
                .businessName(order.getTenant().getName()) // Assuming Tenant has a name
                .workOrderNumber(order.getWorkOrderNumber())
                .vehicleBrand(order.getVehicle().getBrand())
                .vehicleModel(order.getVehicle().getModel())
                .vehicleYear(order.getVehicle().getYear())
                .plate(order.getVehicle().getPlate())
                .customerFirstName(order.getCustomer().getName())
                .diagnosisSummary(order.getDiagnosis())
                .items(items)
                .subtotal(order.getSubtotal())
                .discount(order.getDiscount())
                .tax(order.getTax())
                .total(order.getTotal())
                .status(order.getStatus())
                .expiresAt(publicToken.getExpiresAt())
                .build();
    }

    @Transactional
    public void approveWorkOrder(String token) {
        PublicToken publicToken = publicTokenService.validateToken(token, PublicTokenType.APPROVAL);
        WorkOrder order = publicToken.getWorkOrder();

        if (order.getStatus() != WorkOrderStatus.WAITING_APPROVAL) {
            throw new RuntimeException("WorkOrder is not in WAITING_APPROVAL state");
        }

        // Save snapshot of items
        List<PublicApprovalItemDTO> items = order.getItems().stream()
                .map(item -> PublicApprovalItemDTO.builder()
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .discount(item.getDiscount())
                        .subtotal(item.getSubtotal())
                        .type(item.getItemType().name())
                        .build())
                .collect(Collectors.toList());
        
        try {
            String snapshotJson = objectMapper.writeValueAsString(items);
            order.setApprovedItemsSnapshot(snapshotJson);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize approved items", e);
        }

        // Update WorkOrder
        order.setApprovedSubtotal(order.getSubtotal());
        order.setApprovedDiscount(order.getDiscount());
        order.setApprovedTax(order.getTax());
        order.setApprovedTotal(order.getTotal());
        order.setApprovedAt(LocalDateTime.now());
        order.setApprovalMethod("ONLINE");
        
        WorkOrderStatus previousStatus = order.getStatus();
        order.setStatus(WorkOrderStatus.APPROVED);
        
        workOrderRepository.save(order);

        // Deduct inventory by creating the Sale
        try {
            applicationContext.getBean(WorkOrderService.class).createSaleFromWorkOrder(order.getId(), order.getTenant().getId(), order.getAssignedUser());
        } catch (Exception e) {
            // Log but don't fail public approval if stock is insufficient
            // In a real scenario, we might want to alert the mechanic
            e.printStackTrace();
        }

        // Save history (Using system or null for user since it's public, maybe a system user if one exists. For MVP leaving null or a dummy id)
        WorkOrderStatusHistory history = WorkOrderStatusHistory.builder()
                .tenant(order.getTenant())
                .workOrder(order)
                .previousStatus(previousStatus)
                .newStatus(WorkOrderStatus.APPROVED)
                .changedBy(order.getAssignedUser()) // Or null if allowed. Wait, changedById is NOT NULL in DB? Let's check V2. 
                // Ah, changedById is NOT NULL. We need a way to represent the system/customer.
                // For now, assigning to the assignedUser or the first admin of the tenant.
                .build();
        
        historyRepository.save(history);

        // Revoke token
        publicTokenService.revokeToken(publicToken);
    }

    @Transactional
    public void rejectWorkOrder(String token, PublicApprovalRejectRequest request) {
        PublicToken publicToken = publicTokenService.validateToken(token, PublicTokenType.APPROVAL);
        WorkOrder order = publicToken.getWorkOrder();

        if (order.getStatus() != WorkOrderStatus.WAITING_APPROVAL) {
            throw new RuntimeException("WorkOrder is not in WAITING_APPROVAL state");
        }

        // Add rejection note to customer notes
        String rejectionNote = "Rechazado online. Motivo: " + request.getReason() + ". Comentario: " + request.getComment();
        order.setCustomerNotes(order.getCustomerNotes() == null ? rejectionNote : order.getCustomerNotes() + "\n" + rejectionNote);
        
        WorkOrderStatus previousStatus = order.getStatus();
        order.setStatus(WorkOrderStatus.DIAGNOSIS);
        
        workOrderRepository.save(order);

        WorkOrderStatusHistory history = WorkOrderStatusHistory.builder()
                .tenant(order.getTenant())
                .workOrder(order)
                .previousStatus(previousStatus)
                .newStatus(WorkOrderStatus.DIAGNOSIS)
                .changedBy(order.getAssignedUser()) 
                .build();
        
        historyRepository.save(history);

        // Revoke token
        publicTokenService.revokeToken(publicToken);
    }

    @Transactional(readOnly = true)
    public PublicTrackingDTO getTrackingDetails(String token) {
        PublicToken publicToken = publicTokenService.validateToken(token, PublicTokenType.TRACKING);
        WorkOrder order = publicToken.getWorkOrder();

        List<WorkOrderStatusHistory> histories = historyRepository.findByWorkOrderIdOrderByCreatedAtAsc(order.getId());
        
        List<TrackingTimelineEventDTO> timeline = histories.stream()
                .map(h -> TrackingTimelineEventDTO.builder()
                        .status(h.getNewStatus())
                        .timestamp(h.getCreatedAt())
                        .label(getFriendlyStatus(h.getNewStatus()))
                        .build())
                .collect(Collectors.toList());
        
        // Add current status if history doesn't capture initial RECEIVED
        if (timeline.isEmpty() || timeline.get(0).getStatus() != WorkOrderStatus.RECEIVED) {
            timeline.add(0, TrackingTimelineEventDTO.builder()
                    .status(WorkOrderStatus.RECEIVED)
                    .timestamp(order.getCreatedAt())
                    .label("Vehículo recibido")
                    .build());
        }

        return PublicTrackingDTO.builder()
                .businessName(order.getTenant().getName())
                .workOrderNumber(order.getWorkOrderNumber())
                .vehicleBrand(order.getVehicle().getBrand())
                .vehicleModel(order.getVehicle().getModel())
                .vehicleYear(order.getVehicle().getYear())
                .plate(order.getVehicle().getPlate())
                .currentStatus(order.getStatus())
                .timeline(timeline)
                .lastUpdated(order.getUpdatedAt())
                .approvedTotal(order.getApprovedTotal())
                .build();
    }
    
    private String getFriendlyStatus(WorkOrderStatus status) {
        return switch (status) {
            case RECEIVED -> "Vehículo recibido";
            case DIAGNOSIS -> "En diagnóstico";
            case WAITING_APPROVAL -> "Esperando autorización";
            case APPROVED -> "Trabajo autorizado";
            case IN_REPAIR -> "En reparación";
            case QUALITY_CONTROL -> "Control de calidad";
            case READY -> "Listo para entregar";
            case DELIVERED -> "Entregado";
            case CANCELLED -> "Orden cancelada";
        };
    }
}
