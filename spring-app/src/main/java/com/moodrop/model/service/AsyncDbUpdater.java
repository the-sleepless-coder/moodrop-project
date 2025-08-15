package com.moodrop.model.service;

import com.moodrop.model.domain.DeviceNoteLedger;
import com.moodrop.model.domain.MfRecipe;
import com.moodrop.model.repository.*;
import com.moodrop.model.domain.MfLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Slf4j
public class AsyncDbUpdater {

    private final MfJobRepository jobRepo;
    private final MfLogRepository logRepo;
    private final DeviceStockRepository stockRepo;
    private final DeviceNoteInventoryRepository noteInvRepo;
    private final MfRecipeRepository recipeRepo;
    private final DeviceNoteLedgerRepository ledgerRepo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markJobStatus(Long jobId, String status) {
        jobRepo.updateStatus(jobId, status);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateLog(Long id, String event, String detail) {
        logRepo.findById(id).ifPresent(l -> {
            l.setEvent(event);
            if (detail != null) l.setDetail(detail);
            logRepo.save(l);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void appendLog(String deviceId, Long jobId, String cmd, String event, String detail) {
        MfLog l = MfLog.builder()
                .deviceId(deviceId)
                .jobId(jobId)
                .cmd(cmd)
                .event(event)
                .detail(detail == null ? "" : detail)
                .build();
        logRepo.save(l);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void upsertStock(String deviceId, Long slotId, Double amount) {
        stockRepo.upsert(deviceId, slotId, amount);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void addInventory(String deviceId, Long noteId, Double delta) {
        noteInvRepo.add(deviceId, noteId, delta);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void consumeForManufacture(Long jobId, String deviceId, double totalMl) {
        var items = recipeRepo.findAllByJobId(jobId);
        if (items.isEmpty()) return;

        long totalPct = items.stream().mapToLong(r -> r.getProp()).sum();

        for (MfRecipe i : items) {
            long slotId = i.getSlotId();
            long noteId = i.getIngredientId();
            double useMl = totalMl * (i.getProp() / (double) totalPct);

            if (useMl <= 0) continue;

            int ok1 = stockRepo.consumeIfEnough(deviceId, slotId, useMl);
            if (ok1 == 0) throw new IllegalStateException("Slot stock not enough: slot=" + slotId);

            int ok2 = noteInvRepo.consume(deviceId, noteId, useMl);
            if (ok2 == 0) throw new IllegalStateException("Note inventory not enough: note=" + noteId);

            ledgerRepo.save(DeviceNoteLedger.builder()
                    .deviceId(deviceId).noteId(noteId).slotId(slotId)
                    .delta(-useMl).reason("manufacture-consume").build());
        }
    }
}
