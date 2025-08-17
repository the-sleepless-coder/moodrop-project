package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="device_slot_note",
        indexes = {@Index(name="ix_device_note_rev", columnList="device_id,note_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceSlotNote {
    @EmbeddedId
    private DeviceSlotNoteId id;
    @Column(name="note_id",   nullable=false) private Long noteId;
    @Column(name="note_name", nullable=false) private String noteName;
}