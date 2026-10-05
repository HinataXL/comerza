package com.comerza.api.entity;

import com.comerza.api.enums.WorkOrderPhotoCategory;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"WorkOrderPhoto\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenantId", nullable = false)
    private Tenant tenant;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workOrderId", nullable = false)
    private WorkOrder workOrder;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicleId")
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderPhotoCategory category;

    @Column(nullable = false)
    private String storageKey;

    @Column(length = 255)
    private String originalFilename;

    @Column(length = 100)
    private String contentType;

    @Column
    private Long sizeBytes;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploadedById", nullable = false)
    private User uploadedBy;

    @Builder.Default
    @Column(nullable = false)
    private Boolean customerVisible = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
