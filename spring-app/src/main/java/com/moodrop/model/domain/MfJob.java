package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity @Table(name="mf_job", indexes = @Index(name="ix_job_device_updated", columnList="device_id,updated_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfJob {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="job_id")
    private Long id;

    @Column(name="device_id", length=64, nullable=false) private String deviceId;
    @Column(nullable=false) private String status;

    @Column(name="created_at", nullable=false) private LocalDateTime createdAt;
    @Column(name="updated_at", nullable=false) private LocalDateTime updatedAt;

    @PrePersist
    void prePersist(){
        var now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }
    @PreUpdate
    void preUpdate(){ updatedAt = LocalDateTime.now(); }
}