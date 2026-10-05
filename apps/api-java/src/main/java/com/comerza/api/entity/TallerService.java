package com.comerza.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"TallerService\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TallerService {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenantId", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double defaultPrice;

    private Integer estimatedMinutes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
