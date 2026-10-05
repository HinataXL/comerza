package com.comerza.api.entity;

import com.comerza.api.enums.PublicTokenType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"PublicToken\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenantId", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workOrderId", nullable = false)
    private WorkOrder workOrder;

    @Column(nullable = false)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PublicTokenType tokenType;

    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
