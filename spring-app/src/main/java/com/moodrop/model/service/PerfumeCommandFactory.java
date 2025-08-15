package com.moodrop.model.service;

import com.moodrop.mqtt.PerfumeCommand;
import com.moodrop.mqtt.PerfumeData;
import com.moodrop.model.dto.RequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PerfumeCommandFactory {

    private final SlotMappingService mapping;

    public PerfumeCommand.PerfumeCommandRequest toUpdateCommand(String deviceId, RequestDto.UpdateRequestDto dto) {
        List<PerfumeData.PerfumeDataInput> inputs = new ArrayList<>();
        for (var i : dto.getIngredients()) {
            Long slotId = i.getSlotId();
            if (slotId == null) {
                if (i.getNoteId() == null) throw new IllegalArgumentException("noteId or slotId required");
                slotId = (long) mapping.resolveSlotId(deviceId, i.getNoteId());
            }
            inputs.add(PerfumeData.PerfumeDataInput.builder()
                    .slotId(slotId)
                    .name(i.getNoteName())
                    .capacity(i.getCapacity())
                    .build());
        }
        return PerfumeCommand.PerfumeCommandRequest.update(inputs);
    }

    public PerfumeCommand.PerfumeCommandRequest toManufactureCommand(String deviceId, RequestDto.ManufactureRequestDto dto) {
        List<PerfumeData.PerfumeDataInput> inputs = new ArrayList<>();
        for (var i : dto.getIngredients()) {
            Long slotId = i.getSlotId();
            if (slotId == null) {
                if (i.getNoteId() == null) throw new IllegalArgumentException("noteId or slotId required");
                slotId = (long) mapping.resolveSlotId(deviceId, i.getNoteId());
            }
            inputs.add(PerfumeData.PerfumeDataInput.builder()
                    .slotId(slotId)
                    .name(i.getNoteName())
                    .prop(i.getCapacity().longValue())
                    .build());
        }
        return PerfumeCommand.PerfumeCommandRequest.manufacture(inputs, dto.getEthanol());
    }
}
