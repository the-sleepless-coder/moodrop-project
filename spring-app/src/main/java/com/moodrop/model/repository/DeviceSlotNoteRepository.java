package com.moodrop.model.repository;

import com.moodrop.model.domain.DeviceSlotNote;
import com.moodrop.model.domain.DeviceSlotNoteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeviceSlotNoteRepository extends JpaRepository<DeviceSlotNote, DeviceSlotNoteId> {

    @Query("select n.noteId from DeviceSlotNote n where n.id.deviceId=:deviceId and n.id.slotId=:slotId")
    Long findNoteIdBySlotId(@Param("deviceId") String deviceId, @Param("slotId") Long slotId);

    @Query("select n.id.slotId from DeviceSlotNote n where n.id.deviceId=:deviceId and n.noteId=:noteId")
    Long findSlotIdByNoteId(@Param("deviceId") String deviceId, @Param("noteId") Long noteId);

    // MySQL upsert (프로시저 없이)
    @Modifying
    @Query(value = """
        INSERT INTO device_slot_note(device_id, slot_id, note_id, note_name)
        VALUES (:deviceId, :slotId, :noteId, :noteName)
        ON DUPLICATE KEY UPDATE note_id=VALUES(note_id), note_name=VALUES(note_name)
        """, nativeQuery = true)
    int upsertMapping(@Param("deviceId") String deviceId,
                      @Param("slotId") Long slotId,
                      @Param("noteId") Long noteId,
                      @Param("noteName") String noteName);
}
