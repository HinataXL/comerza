package com.comerza.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "\"Reservation\"")
@Data
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"tenantId\"", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"customerId\"", nullable = false)
    private Customer customer;

    private String title;

    @Column(name = "\"startTime\"", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "\"endTime\"", nullable = false)
    private LocalDateTime endTime;

    private String status = "PENDING";
    
    private String notes;

    @Column(name = "\"actionToken\"", unique = true)
    private String actionToken;

    @Column(name = "\"createdAt\"", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (actionToken == null) {
            actionToken = UUID.randomUUID().toString().replace("-", "");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
