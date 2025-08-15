package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="device_note_ledger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceNoteLedger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length=64, nullable=false) private String deviceId;
    @Column(nullable=false)            private Long noteId;
    @Column(nullable=false)            private Long slotId;
    @Column(nullable=false)            private Double delta;
    @Column(nullable=false)            private String reason;
    @Column(nullable=false)            private LocalDateTime createdAt;

    @PrePersist void prePersist(){ if (createdAt == null) createdAt = LocalDateTime.now(); }
}