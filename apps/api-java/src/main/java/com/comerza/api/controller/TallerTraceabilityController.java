package com.comerza.api.controller;

import com.comerza.api.dto.*;
import com.comerza.api.entity.WorkOrder;
import com.comerza.api.entity.WorkOrderChecklistItem;
import com.comerza.api.entity.WorkOrderPhoto;
import com.comerza.api.enums.WorkOrderPhotoCategory;
import com.comerza.api.security.UserDetailsImpl;
import com.comerza.api.service.WorkOrderTraceabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/taller/work-orders/{id}")
@RequiredArgsConstructor
public class TallerTraceabilityController {

    private final WorkOrderTraceabilityService traceabilityService;

    // --- RECEPTION ---
    @PutMapping("/reception")
    public ResponseEntity<?> updateReception(
            @PathVariable String id,
            @RequestBody WorkOrderReceptionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            WorkOrder updated = traceabilityService.updateReception(id, userDetails.getUser().getTenant().getId(), request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- CHECKLIST ---
    @GetMapping("/checklist")
    public ResponseEntity<?> getChecklist(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            List<WorkOrderChecklistItem> items = traceabilityService.getChecklist(id, userDetails.getUser().getTenant().getId());
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/checklist")
    public ResponseEntity<?> updateChecklist(
            @PathVariable String id,
            @RequestBody WorkOrderChecklistRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            List<WorkOrderChecklistItem> items = traceabilityService.updateChecklist(id, userDetails.getUser().getTenant().getId(), request);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- QUALITY CONTROL ---
    @PutMapping("/quality-control")
    public ResponseEntity<?> updateQualityControl(
            @PathVariable String id,
            @RequestBody WorkOrderQualityControlRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            WorkOrder updated = traceabilityService.updateQualityControl(id, userDetails.getUser().getTenant().getId(), request, userDetails.getUser());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- DELIVERY ---
    @PostMapping("/deliver")
    public ResponseEntity<?> deliverVehicle(
            @PathVariable String id,
            @RequestBody WorkOrderDeliveryRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            WorkOrder updated = traceabilityService.deliverVehicle(id, userDetails.getUser().getTenant().getId(), request, userDetails.getUser());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- PHOTOS ---
    @GetMapping("/photos")
    public ResponseEntity<?> getPhotos(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            List<WorkOrderPhotoDTO> photos = traceabilityService.getPhotos(id, userDetails.getUser().getTenant().getId());
            return ResponseEntity.ok(photos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/photos")
    public ResponseEntity<?> uploadPhoto(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") WorkOrderPhotoCategory category,
            @RequestParam(value = "description", required = false) String description,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            WorkOrderPhotoDTO photo = traceabilityService.uploadPhoto(id, userDetails.getUser().getTenant().getId(), file, category, description, userDetails.getUser());
            return ResponseEntity.ok(photo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/photos/{photoId}")
    public ResponseEntity<?> deletePhoto(
            @PathVariable String id,
            @PathVariable String photoId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            traceabilityService.deletePhoto(photoId, id, userDetails.getUser().getTenant().getId());
            return ResponseEntity.ok(Map.of("message", "Photo deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
