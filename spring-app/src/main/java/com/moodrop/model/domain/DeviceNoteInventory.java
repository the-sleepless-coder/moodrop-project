package com.moodrop.model.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name="device_note_inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceNoteInventory {
    @EmbeddedId
    private DeviceNoteInventoryId id;

    @Column(name = "amount", nullable = false)
    private Double amount;
}