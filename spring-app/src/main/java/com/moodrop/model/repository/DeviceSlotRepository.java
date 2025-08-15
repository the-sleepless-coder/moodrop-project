package com.moodrop.model.repository;

import com.moodrop.model.domain.DeviceSlot;
import com.moodrop.model.domain.DeviceSlotId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface DeviceSlotRepository extends JpaRepository<DeviceSlot, DeviceSlotId> {
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO device_slot(device_id, slot_id, name)
        VALUES (:deviceId, :slotId, :name)
        ON DUPLICATE KEY UPDATE device_id = device_id
        """, nativeQuery = true)
    int ensureSlot(@Param("deviceId") String deviceId,
                   @Param("slotId") Long slotId,
                   @Param("name") String name);

    @Query(value = "SELECT max_capacity FROM device_slot WHERE device_id=:deviceId AND slot_id=:slotId", nativeQuery = true)
    Integer findMaxCapacity(@Param("deviceId") String deviceId, @Param("slotId") Long slotId);
}