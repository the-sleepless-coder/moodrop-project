package com.moodrop.model.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DeviceSlotId implements Serializable {
    @Column(length = 64, nullable = false) private String deviceId;
    @Column(nullable = false)             private Long slotId;
}