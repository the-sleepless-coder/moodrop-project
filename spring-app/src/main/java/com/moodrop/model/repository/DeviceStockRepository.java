package com.moodrop.model.repository;

import com.moodrop.model.domain.DeviceStock;
import com.moodrop.model.domain.DeviceStockId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeviceStockRepository extends JpaRepository<DeviceStock, DeviceStockId> {
    @Query(value = "SELECT amount FROM device_stock WHERE device_id=:deviceId AND slot_id=:slotId", nativeQuery = true)
    Long findAmount(@Param("deviceId") String deviceId, @Param("slotId") Long slotId);

    @Modifying
    @Query(value = """
        INSERT INTO device_stock(device_id, slot_id, amount)
        VALUES (:deviceId, :slotId, :amount)
        ON DUPLICATE KEY UPDATE amount = VALUES(amount)
        """, nativeQuery = true)
    int upsert(@Param("deviceId") String deviceId,
               @Param("slotId") Long slotId,
               @Param("amount") Double amount);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE DeviceStock s
           SET s.amount = s.amount - :delta
         WHERE s.id.deviceId = :deviceId
           AND s.id.slotId   = :slotId
           AND s.amount     >= :delta
    """)
    int consumeIfEnough(@Param("deviceId") String deviceId,
                        @Param("slotId") Long slotId,
                        @Param("delta") Double delta);

}