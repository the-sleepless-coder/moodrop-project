package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "device_endpoint")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceEndpoint {

    @Id
    @Column(name = "device_id", length = 100, nullable = false)
    private String deviceId;

    @Column(name = "host", length = 255, nullable = false)
    private String host;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
