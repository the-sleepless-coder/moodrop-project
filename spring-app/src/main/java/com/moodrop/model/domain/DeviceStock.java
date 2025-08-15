package com.moodrop.model.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name="device_stock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceStock {
    @EmbeddedId
    private DeviceStockId id;
    @Column(nullable=false) private Double amount;
}