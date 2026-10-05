package com.comerza.api.entity;

import com.comerza.api.enums.WorkOrderStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "\"WorkOrder\"")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenantId", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customerId", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicleId", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignedUserId")
    private User assignedUser;

    @Column(nullable = false)
    private String workOrderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WorkOrderStatus status = WorkOrderStatus.RECEIVED;

    private Integer entryMileage;
    
    @Enumerated(EnumType.STRING)
    private com.comerza.api.enums.FuelLevel fuelLevel;
    
    @Column(columnDefinition = "TEXT")
    private String customerComplaint;
    
    @Column(columnDefinition = "TEXT")
    private String initialInspection;
    
    @Column(columnDefinition = "TEXT")
    private String diagnosis;
    
    @Column(columnDefinition = "TEXT")
    private String internalNotes;
    
    @Column(columnDefinition = "TEXT")
    private String customerNotes;

    @Builder.Default
    private Double subtotal = 0.0;
    @Builder.Default
    private Double discount = 0.0;
    @Builder.Default
    private Double tax = 0.0;
    @Builder.Default
    private Double total = 0.0;

    // Snapshot of approved values
    private Double approvedSubtotal;
    private Double approvedDiscount;
    private Double approvedTax;
    private Double approvedTotal;
    private String approvalMethod;
    
    @Column(columnDefinition = "TEXT")
    private String approvedItemsSnapshot;

    private LocalDateTime approvedAt;
    private LocalDateTime completedAt;
    private LocalDateTime deliveredAt;

    // FASE 5 Fields
    @Column(columnDefinition = "TEXT")
    private String qualityControlNotes;
    private LocalDateTime qualityControlledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qualityControlledById")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User qualityControlledBy;

    private Integer exitMileage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deliveredById")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User deliveredBy;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saleId")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Sale sale;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkOrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
