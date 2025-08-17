package com.moodrop.model.service;

import com.moodrop.model.repository.DeviceSlotNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SlotMappingService {

    private final DeviceSlotNoteRepository deviceSlotNoteRepository;

    @Transactional(readOnly = true)
    public long resolveSlotId(String deviceId, long noteId) {
        Long slotId = deviceSlotNoteRepository.findSlotIdByNoteId(deviceId, noteId);
        if (slotId == null) throw new IllegalArgumentException("No slot mapped for noteId="+noteId+" on "+deviceId);
        return slotId;
    }
}
