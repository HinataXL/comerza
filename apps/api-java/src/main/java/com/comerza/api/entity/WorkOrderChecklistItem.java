package com.comerza.api.entity;

import com.comerza.api.enums.WorkOrderChecklistItemStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"WorkOrderChecklistItem\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderChecklistItem {

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

    @Column(nullable = false)
    private String itemCode;

    @Column(nullable = false)
    private String labelSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderChecklistItemStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
