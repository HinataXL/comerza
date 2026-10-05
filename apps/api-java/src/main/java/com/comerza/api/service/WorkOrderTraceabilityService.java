package com.comerza.api.service;

import com.comerza.api.dto.*;
import com.comerza.api.entity.*;
import com.comerza.api.enums.WorkOrderChecklistItemStatus;
import com.comerza.api.enums.WorkOrderPhotoCategory;
import com.comerza.api.enums.WorkOrderStatus;
import com.comerza.api.repository.VehicleRepository;
import com.comerza.api.repository.WorkOrderChecklistRepository;
import com.comerza.api.repository.WorkOrderPhotoRepository;
import com.comerza.api.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkOrderTraceabilityService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderChecklistRepository checklistRepository;
    private final WorkOrderPhotoRepository photoRepository;
    private final VehicleRepository vehicleRepository;
    private final S3StorageService s3StorageService;

    // --- RECEPTION ---
    @Transactional
    public WorkOrder updateReception(String workOrderId, String tenantId, WorkOrderReceptionRequest request) {
        WorkOrder order = getWorkOrder(workOrderId, tenantId);
        
        if (order.getStatus() == WorkOrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot modify a delivered work order.");
        }

        order.setEntryMileage(request.getEntryMileage());
        order.setFuelLevel(request.getFuelLevel());
        order.setCustomerComplaint(request.getCustomerComplaint());
        order.setInitialInspection(request.getInitialInspection());

        return workOrderRepository.save(order);
    }

    // --- CHECKLIST ---
    @Transactional(readOnly = true)
    public List<WorkOrderChecklistItem> getChecklist(String workOrderId, String tenantId) {
        return checklistRepository.findByWorkOrderIdAndTenantId(workOrderId, tenantId);
    }

    @Transactional
    public List<WorkOrderChecklistItem> updateChecklist(String workOrderId, String tenantId, WorkOrderChecklistRequest request) {
        WorkOrder order = getWorkOrder(workOrderId, tenantId);
        
        if (order.getStatus() == WorkOrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot modify a delivered work order.");
        }

        // Delete previous
        checklistRepository.deleteByWorkOrderIdAndTenantId(workOrderId, tenantId);

        // Save new
        List<WorkOrderChecklistItem> newItems = request.getItems().stream().map(req -> 
            WorkOrderChecklistItem.builder()
                .tenant(order.getTenant())
                .workOrder(order)
                .itemCode(req.getItemCode())
                .labelSnapshot(req.getLabelSnapshot())
                .status(req.getStatus())
                .notes(req.getNotes())
                .build()
        ).collect(Collectors.toList());

        return checklistRepository.saveAll(newItems);
    }

    // --- QUALITY CONTROL ---
    @Transactional
    public WorkOrder updateQualityControl(String workOrderId, String tenantId, WorkOrderQualityControlRequest request, User user) {
        WorkOrder order = getWorkOrder(workOrderId, tenantId);
        
        if (order.getStatus() == WorkOrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot modify a delivered work order.");
        }

        order.setQualityControlNotes(request.getQualityControlNotes());
        order.setQualityControlledAt(LocalDateTime.now());
        order.setQualityControlledBy(user);

        return workOrderRepository.save(order);
    }

    // --- DELIVERY ---
    @Transactional
    public WorkOrder deliverVehicle(String workOrderId, String tenantId, WorkOrderDeliveryRequest request, User user) {
        WorkOrder order = getWorkOrder(workOrderId, tenantId);
        
        if (order.getStatus() != WorkOrderStatus.READY) {
            throw new RuntimeException("Work order must be in READY state to be delivered.");
        }

        if (request.getExitMileage() != null) {
            if (order.getEntryMileage() != null && request.getExitMileage() < order.getEntryMileage()) {
                throw new RuntimeException("Exit mileage cannot be less than entry mileage.");
            }
            order.setExitMileage(request.getExitMileage());
            
            // Update Vehicle Mileage
            Vehicle vehicle = order.getVehicle();
            if (vehicle.getMileage() == null || request.getExitMileage() > vehicle.getMileage()) {
                vehicle.setMileage(request.getExitMileage());
                vehicleRepository.save(vehicle);
            }
        }

        order.setDeliveredAt(LocalDateTime.now());
        order.setDeliveredBy(user);
        order.setStatus(WorkOrderStatus.DELIVERED);
        
        if (request.getDeliveryNotes() != null) {
            order.setCustomerNotes((order.getCustomerNotes() == null ? "" : order.getCustomerNotes() + "\n") + "Notas de entrega: " + request.getDeliveryNotes());
        }

        return workOrderRepository.save(order);
    }

    // --- PHOTOS ---
    @Transactional(readOnly = true)
    public List<WorkOrderPhotoDTO> getPhotos(String workOrderId, String tenantId) {
        List<WorkOrderPhoto> photos = photoRepository.findByWorkOrderIdAndTenantIdOrderByCreatedAtDesc(workOrderId, tenantId);
        return photos.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public WorkOrderPhotoDTO uploadPhoto(String workOrderId, String tenantId, MultipartFile file, WorkOrderPhotoCategory category, String description, User user) {
        WorkOrder order = getWorkOrder(workOrderId, tenantId);
        
        if (order.getStatus() == WorkOrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot add photos to a delivered work order.");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            throw new RuntimeException("Invalid file type. Only JPEG, PNG and WEBP are allowed.");
        }

        // Validate size (10MB)
        long sizeBytes = file.getSize();
        if (sizeBytes > 10 * 1024 * 1024) {
            throw new RuntimeException("File is too large. Maximum size is 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        String storageKey = s3StorageService.store(file, tenantId, workOrderId, category.name());

        try {
            WorkOrderPhoto photo = WorkOrderPhoto.builder()
                    .tenant(order.getTenant())
                    .workOrder(order)
                    .vehicle(order.getVehicle())
                    .category(category)
                    .storageKey(storageKey)
                    .originalFilename(originalFilename)
                    .contentType(contentType)
                    .sizeBytes(sizeBytes)
                    .description(description)
                    .uploadedBy(user)
                    .customerVisible(false) // Default to false for future public portal rules
                    .build();

            WorkOrderPhoto saved = photoRepository.save(photo);
            return mapToDto(saved);
        } catch (Exception e) {
            // Rollback from S3 if DB save fails
            s3StorageService.delete(storageKey);
            throw new RuntimeException("Failed to persist photo in database, rolled back S3 upload.", e);
        }
    }

    private WorkOrderPhotoDTO mapToDto(WorkOrderPhoto photo) {
        return WorkOrderPhotoDTO.builder()
                .id(photo.getId())
                .category(photo.getCategory())
                .description(photo.getDescription())
                .contentType(photo.getContentType())
                .sizeBytes(photo.getSizeBytes())
                .createdAt(photo.getCreatedAt())
                .uploadedByName(photo.getUploadedBy() != null ? photo.getUploadedBy().getName() : null)
                .viewUrl(s3StorageService.generateViewUrl(photo.getStorageKey()))
                .build();
    }

    @Transactional
    public void deletePhoto(String photoId, String workOrderId, String tenantId) {
        WorkOrderPhoto photo = photoRepository.findByIdAndTenantId(photoId, tenantId)
                .orElseThrow(() -> new RuntimeException("Photo not found"));
        
        if (!photo.getWorkOrder().getId().equals(workOrderId)) {
            throw new RuntimeException("Photo does not belong to this work order.");
        }

        if (photo.getWorkOrder().getStatus() == WorkOrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot delete photos from a delivered work order.");
        }

        s3StorageService.delete(photo.getStorageKey());
        photoRepository.delete(photo);
    }

    private WorkOrder getWorkOrder(String workOrderId, String tenantId) {
        return workOrderRepository.findByIdAndTenantId(workOrderId, tenantId)
                .orElseThrow(() -> new RuntimeException("WorkOrder not found"));
    }
}
