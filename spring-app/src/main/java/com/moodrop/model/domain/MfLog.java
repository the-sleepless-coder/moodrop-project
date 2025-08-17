package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="mf_log", indexes = @Index(name="ix_log_device_created", columnList="device_id,created_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="device_id", length=64, nullable=false) private String deviceId;
    @Column(name="job_id") private Long jobId;
    @Column(nullable=false) private String cmd; // update / manufacture / check
    @Column(nullable=false) private String event;  // request / ack / progress / timeout ...
    @Column(nullable=false, length=1000) private String detail;
    @Column(name="created_at", nullable=false) private LocalDateTime createdAt;

    @PrePersist void prePersist(){ if (createdAt == null) createdAt = LocalDateTime.now(); }
}