package com.comerza.api.controller;

import com.comerza.api.dto.VehicleRequest;
import com.comerza.api.dto.WorkOrderRequest;
import com.comerza.api.dto.WorkOrderStatusRequest;
import com.comerza.api.entity.Vehicle;
import com.comerza.api.entity.WorkOrder;
import com.comerza.api.security.UserDetailsImpl;
import com.comerza.api.service.VehicleService;
import com.comerza.api.service.WorkOrderService;
import com.comerza.api.service.WorkOrderStatusService;
import com.comerza.api.service.PublicTokenService;
import com.comerza.api.enums.PublicTokenType;
import com.comerza.api.dto.PublicLinkResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/taller")
@RequiredArgsConstructor
public class TallerController {

    private final VehicleService vehicleService;
    private final WorkOrderService workOrderService;
    private final WorkOrderStatusService workOrderStatusService;
    private final PublicTokenService publicTokenService;

    // --- VEHICLES ---

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getVehicles(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(vehicleService.getVehiclesByTenant(userDetails.getUser().getTenant().getId()));
    }

    @GetMapping("/vehicles/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(vehicleService.getVehicleByIdAndTenant(id, userDetails.getUser().getTenant().getId()));
    }

    @PostMapping("/vehicles")
    public ResponseEntity<?> createVehicle(@RequestBody VehicleRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Vehicle vehicle = vehicleService.createVehicle(userDetails.getUser().getTenant().getId(), request);
            return ResponseEntity.status(201).body(vehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- WORK ORDERS ---

    @GetMapping("/work-orders")
    public ResponseEntity<List<WorkOrder>> getWorkOrders(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByTenant(userDetails.getUser().getTenant().getId()));
    }

    @GetMapping("/work-orders/{id}")
    public ResponseEntity<WorkOrder> getWorkOrderById(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(workOrderService.getWorkOrderByIdAndTenant(id, userDetails.getUser().getTenant().getId()));
    }

    @PostMapping("/work-orders")
    public ResponseEntity<?> createWorkOrder(@RequestBody WorkOrderRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            WorkOrder workOrder = workOrderService.createWorkOrder(userDetails.getUser().getTenant().getId(), userDetails.getUser(), request);
            return ResponseEntity.status(201).body(workOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/work-orders/{id}/status")
    public ResponseEntity<?> updateWorkOrderStatus(
            @PathVariable String id, 
            @RequestBody WorkOrderStatusRequest request, 
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            WorkOrder workOrder = workOrderStatusService.changeStatus(
                    id, 
                    userDetails.getUser().getTenant().getId(), 
                    request.getNewStatus(), 
                    userDetails.getUser()
            );
            return ResponseEntity.ok(workOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/work-orders/{id}/approval-link")
    public ResponseEntity<?> generateApprovalLink(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            WorkOrder workOrder = workOrderService.getWorkOrderByIdAndTenant(id, userDetails.getUser().getTenant().getId());
            if (workOrder.getStatus() != com.comerza.api.enums.WorkOrderStatus.WAITING_APPROVAL) {
                return ResponseEntity.badRequest().body(Map.of("message", "WorkOrder must be in WAITING_APPROVAL state"));
            }
            String token = publicTokenService.generateToken(workOrder, PublicTokenType.APPROVAL, 7);
            
            // Note: The frontend will construct the full URL. We just return the token and expiration.
            return ResponseEntity.ok(PublicLinkResponse.builder()
                    .url(token)
                    .expiresAt(java.time.LocalDateTime.now().plusDays(7))
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/work-orders/{id}/tracking-link")
    public ResponseEntity<?> generateTrackingLink(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            WorkOrder workOrder = workOrderService.getWorkOrderByIdAndTenant(id, userDetails.getUser().getTenant().getId());
            String token = publicTokenService.generateToken(workOrder, PublicTokenType.TRACKING, 30);
            
            return ResponseEntity.ok(PublicLinkResponse.builder()
                    .url(token)
                    .expiresAt(java.time.LocalDateTime.now().plusDays(30))
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/work-orders/{id}/create-sale")
    public ResponseEntity<?> createSaleFromWorkOrder(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            com.comerza.api.entity.Sale sale = workOrderService.createSaleFromWorkOrder(id, userDetails.getUser().getTenant().getId(), userDetails.getUser());
            return ResponseEntity.ok(sale);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
