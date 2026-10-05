package com.comerza.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"SystemLog\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 50)
    private String level;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Column(name = "\"user\"") // user es palabra reservada en PostgreSQL
    private String user;

    private String ip;
    private String path;
    private String origin;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
