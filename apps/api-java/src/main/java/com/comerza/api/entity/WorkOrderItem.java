package com.comerza.api.entity;

import com.comerza.api.enums.WorkOrderItemType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"WorkOrderItem\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderItem {

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderItemType itemType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "productId")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "serviceId")
    private TallerService service;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Double quantity = 1.0;

    @Column(nullable = false)
    @Builder.Default
    private Double unitPrice = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double discount = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double subtotal = 0.0;

    private String status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
