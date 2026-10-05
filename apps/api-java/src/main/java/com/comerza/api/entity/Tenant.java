package com.comerza.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"Tenant\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    private String qpayproApiKey;
    private String qpayproApiSecret;
    
    @Column(columnDefinition = "boolean default false")
    private Boolean isQpayproActive;

    private String recurrenteSecretKey;
    private String recurrenteTerminalId;
    
    @Column(columnDefinition = "boolean default false")
    private Boolean isRecurrenteActive;

    private String logoUrl;

    @Column(columnDefinition = "varchar(50) default 'CLASSIC'")
    private String receiptTemplate;

    @Column(name = "has_taller_addon", columnDefinition = "boolean default false")
    private Boolean hasTallerAddon;

    @Column(columnDefinition = "varchar(50) default 'PRO'")
    private String plan;

    @Column(columnDefinition = "varchar(50) default 'EMAIL'")
    private String reservationNotificationType;

    @Column(columnDefinition = "boolean default true")
    private Boolean isActive;

    @Column(columnDefinition = "varchar(50) default 'PENDING_PAYMENT'")
    private String status;

    private String nit;
    private String responsibleName;
    private String email;
    private String phone;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
