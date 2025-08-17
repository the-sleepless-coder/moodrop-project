package com.moodrop.model.repository;

import com.moodrop.model.domain.DeviceNoteInventory;
import com.moodrop.model.domain.DeviceNoteInventoryId;
import com.moodrop.model.dto.NoteAmountDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DeviceNoteInventoryRepository extends JpaRepository<DeviceNoteInventory, DeviceNoteInventoryId> {

    // 누적 += delta
    @Modifying
    @Query(value = """
        INSERT INTO device_note_inventory(device_id, note_id, amount)
        VALUES (:deviceId, :noteId, :delta)
        ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)
        """, nativeQuery = true)
    int add(@Param("deviceId") String deviceId,
            @Param("noteId") Long noteId,
            @Param("delta") Double delta);

    @Modifying
    @Query("""
    UPDATE DeviceNoteInventory d
       SET d.amount = d.amount - :delta
     WHERE d.id.deviceId = :deviceId
       AND d.id.noteId   = :noteId
       AND d.amount     >= :delta
    """)
    int consume(@Param("deviceId") String deviceId,
                @Param("noteId") Long noteId,
                @Param("delta") Double delta);

    @Query("""
        SELECT new com.moodrop.model.dto.NoteAmountDto(d.id.noteId, d.amount)
        FROM DeviceNoteInventory d
        WHERE d.id.noteId IN :noteIds
        """)
    List<NoteAmountDto> findNoteIdAndAmountByNoteIds(List<Long> noteIds);

}