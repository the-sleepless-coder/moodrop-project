package com.moodrop.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodrop.model.domain.DeviceNoteLedger;
import com.moodrop.model.domain.MfJob;
import com.moodrop.model.domain.MfLog;
import com.moodrop.model.domain.MfRecipe;
import com.moodrop.model.dto.DashboardStatsDto;
import com.moodrop.model.dto.NoteAmountDto;
import com.moodrop.model.dto.RequestDto;
import com.moodrop.model.dto.ResponseDto;
import com.moodrop.model.enums.MachineStatus;
import com.moodrop.model.enums.ResponseCMDType;
import com.moodrop.model.repository.*;
import com.moodrop.model.service.AsyncDbUpdater;
import com.moodrop.model.service.PerfumeCommandFactory;
import com.moodrop.util.WebSocketNotifier;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttService {

    private final MqttGateway mqttGateway;
    private final PerfumeCommandFactory factory;

    private final DeviceEndpointRepository endpointRepo;
    private final DeviceSlotRepository slotRepo;
    private final DeviceSlotNoteRepository slotNoteRepo;
    private final DeviceStockRepository stockRepo;
    private final DeviceNoteInventoryRepository noteInvRepo;
    private final DeviceNoteLedgerRepository ledgerRepo;
    private final MfJobRepository jobRepo;
    private final MfRecipeRepository recipeRepo;
    private final MfLogRepository logRepo;
    private final WebSocketNotifier webSocketNotifier;

    private final AsyncDbUpdater asyncDb;

    private final ObjectMapper om = new ObjectMapper();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    private final ConcurrentMap<String, CompletableFuture<ResponseDto.UpdateResponseDto>> updateFutureByDevice = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Long> updateLogIdByDevice = new ConcurrentHashMap<>();


    private final ConcurrentMap<String, CompletableFuture<ResponseDto.CheckResponseDto>> checkFutureByDevice = new ConcurrentHashMap<>();

    private final ConcurrentMap<String, CompletableFuture<ResponseDto.ConnectResponseDto>> connectFutureByDevice = new ConcurrentHashMap<>();


    private final ConcurrentMap<String, CompletableFuture<ResponseDto.ManufactureResponseDto>> mfFutureByDevice = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, CompletableFuture<ResponseDto.ManufactureResponseDto>> mfWaitByJob = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, LocalDateTime> jobStartedAt = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Long> mfLogIdByJob = new ConcurrentHashMap<>();
    private final Map<String, Long> lastJobIdByDevice = new ConcurrentHashMap<>();

    private final Map<Long, Double> cacheStock = new ConcurrentHashMap<>();

    @PersistenceContext
    private EntityManager em;

    private void publishToDevice(PerfumeCommand.PerfumeCommandRequest cmd) {
        try {
            String payload = om.writeValueAsString(cmd);
            System.out.println(payload);
            mqttGateway.sendToMqtt(payload);
            log.info("[MQTT OUT] {}", payload);
        } catch (Exception e) {
            throw new RuntimeException("MQTT publish failed", e);
        }
    }

    private void timeout(CompletableFuture<?> fut, long t, TimeUnit unit, Runnable cleanup) {
        scheduler.schedule(() -> {
            if (!fut.isDone()) {
                fut.completeExceptionally(new TimeoutException("MQTT response timeout"));
                try { cleanup.run(); } catch (Exception ignore) {}
            }
        }, t, unit);
    }

    private void publishAfterCommit(Runnable task) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { task.run(); }
            });
        } else {
            task.run();
        }
    }

    // =========================================================
    // UPDATE
    // =========================================================
    @Transactional
    public CompletableFuture<ResponseDto.UpdateResponseDto> updateAsync(String deviceId, RequestDto.UpdateRequestDto dto) {
        if (dto == null || dto.getIngredients() == null || dto.getIngredients().isEmpty()) {
            throw new IllegalArgumentException("ingredients empty");
        }
        endpointRepo.ensureExists(deviceId);

        if (updateFutureByDevice.putIfAbsent(deviceId, new CompletableFuture<>()) != null) {
            throw new IllegalStateException("update in-flight for device " + deviceId);
        }
        CompletableFuture<ResponseDto.UpdateResponseDto> fut = updateFutureByDevice.get(deviceId);

        List<PerfumeData.PerfumeDataInput> toSend = new ArrayList<>();
        List<Ingredient> snapshot = new ArrayList<>();
        List<String> conflicts = new ArrayList<>();

        for (Ingredient ing : dto.getIngredients()) {
            Long slotId = ing.getSlotId();
            Long noteId = ing.getNoteId();
            Double amount = ing.getCapacity();
            String name = ing.getNoteName();

            if (slotId == null || noteId == null || amount == null || amount <= 0) {
                updateFutureByDevice.remove(deviceId);
                throw new IllegalArgumentException("slotId, ingredientId, amount(>0) required");
            }

            slotRepo.ensureSlot(deviceId, slotId, ing.getNoteName());

            Long curNoteId = slotNoteRepo.findNoteIdBySlotId(deviceId, slotId);
            Long curAmount = Optional.ofNullable(stockRepo.findAmount(deviceId, slotId)).orElse(0L);
            Integer maxCap = slotRepo.findMaxCapacity(deviceId, slotId);

            if (curNoteId == null) {
                slotNoteRepo.upsertMapping(deviceId, slotId, noteId, name);

                Double newAmount = amount;
                stockRepo.upsert(deviceId, slotId, newAmount);
                noteInvRepo.add(deviceId, noteId, newAmount);
                ledgerRepo.save(DeviceNoteLedger.builder()
                        .deviceId(deviceId).noteId(noteId).slotId(slotId)
                        .delta((double)newAmount).reason("update-fill").build());

                toSend.add(PerfumeData.PerfumeDataInput.builder()
                        .slotId(slotId).capacity(newAmount).name(name).build());
                snapshot.add(new Ingredient(slotId, noteId, name, newAmount));

            } else if (curNoteId.equals(noteId)) {
                double candidate = curAmount + amount;
                double capped = (maxCap == null) ? candidate : Math.min(candidate, maxCap);
                double accepted = capped - curAmount;
                if (accepted <= 0) {
                    conflicts.add("slot " + slotId + " full");
                    continue;
                }

                stockRepo.upsert(deviceId, slotId, capped);
                noteInvRepo.add(deviceId, noteId, accepted);
                ledgerRepo.save(DeviceNoteLedger.builder()
                        .deviceId(deviceId).noteId(noteId).slotId(slotId)
                        .delta((double)accepted).reason("update-fill").build());

                toSend.add(PerfumeData.PerfumeDataInput.builder()
                        .slotId(slotId).capacity(accepted).name(name).build());
                snapshot.add(new Ingredient(slotId, noteId, name, capped));

            } else {
                if (curAmount > 0) {
                    conflicts.add("slot " + slotId + " contains another note (" + curAmount + "ml)");
                    continue;
                }
                slotNoteRepo.upsertMapping(deviceId, slotId, noteId, name);

                double newAmount = amount;
                stockRepo.upsert(deviceId, slotId, newAmount);
                noteInvRepo.add(deviceId, noteId, newAmount);
                ledgerRepo.save(DeviceNoteLedger.builder()
                        .deviceId(deviceId).noteId(noteId).slotId(slotId)
                        .delta(newAmount).reason("update-fill").build());

                toSend.add(PerfumeData.PerfumeDataInput.builder()
                        .slotId(slotId).capacity(newAmount).name(name).build());
                snapshot.add(new Ingredient(slotId, noteId, name, newAmount));
            }
        }

        if (!conflicts.isEmpty()) {
            updateFutureByDevice.remove(deviceId);
            throw new IllegalStateException(String.join("; ", conflicts));
        }

        String summary = "items=" + toSend.size() + ", slots=" + toSend.stream().map(PerfumeData.PerfumeDataInput::getSlotId).toList();
        MfLog reqLog = logRepo.save(MfLog.builder()
                .deviceId(deviceId).cmd("update").event("REQUESTED").detail(summary).build());
        updateLogIdByDevice.put(deviceId, reqLog.getId());

        PerfumeCommand.PerfumeCommandRequest cmd = PerfumeCommand.PerfumeCommandRequest.update(toSend);

        publishAfterCommit(() -> {
            try {
                publishToDevice(cmd);
            } catch (Exception e) {
                asyncDb.updateLog(reqLog.getId(), "PUBLISH_FAILED", e.toString());
                CompletableFuture<ResponseDto.UpdateResponseDto> f = updateFutureByDevice.remove(deviceId);
                if (f != null) f.completeExceptionally(new RuntimeException("publish failed", e));
            }
        });

        timeout(fut, 30, TimeUnit.SECONDS, () -> {
            CompletableFuture<ResponseDto.UpdateResponseDto> f = updateFutureByDevice.remove(deviceId);
            Long lid = updateLogIdByDevice.remove(deviceId);
            if (lid != null) asyncDb.updateLog(lid, "TIMEOUT", "no ack within 30s");
            if (f != null) f.completeExceptionally(new TimeoutException("update timeout"));
        });

        for (Ingredient ing : snapshot) cacheStock.put(ing.getSlotId(), ing.getCurrentAmount());
        return fut;
    }

    // =========================================================
    // MANUFACTURE
    // =========================================================
    @Transactional
    public CompletableFuture<ResponseDto.ManufactureResponseDto> manufactureAsync(String deviceId, RequestDto.ManufactureRequestDto dto) {
        endpointRepo.ensureExists(deviceId);

        CompletableFuture<ResponseDto.ManufactureResponseDto> fut = new CompletableFuture<>();
        if (mfFutureByDevice.putIfAbsent(deviceId, fut) != null) {
            throw new IllegalStateException("manufacture in-flight for device " + deviceId);
        }

        MfJob job = jobRepo.save(MfJob.builder()
                .deviceId(deviceId).status("CREATED").build());
        Long jobId = job.getId();

        for (Ingredient ing : dto.getIngredients()) {
            Long slotId = ing.getSlotId();
            if (slotId == null) {
                if (ing.getNoteId() == null) throw new IllegalArgumentException("noteId or slotId required");
                Long mapped = slotNoteRepo.findSlotIdByNoteId(deviceId, ing.getNoteId());
                if (mapped == null) throw new IllegalArgumentException("No slot mapped for noteId");
                slotId = mapped;
            }
            slotRepo.ensureSlot(deviceId, slotId, ing.getNoteName());

            recipeRepo.save(MfRecipe.builder()
                    .jobId(jobId)
                    .slotId(slotId)
                    .ingredientId(ing.getNoteId())
                    .name(ing.getNoteName())
                    .prop(ing.getCapacity().longValue())
                    .build());
        }

        MfLog logHead = logRepo.save(MfLog.builder()
                .deviceId(deviceId).jobId(jobId)
                .cmd("manufacture").event("REQUESTED")
                .detail("items=" + dto.getIngredients().size())
                .build());

        PerfumeCommand.PerfumeCommandRequest cmd = factory.toManufactureCommand(deviceId, dto);

        publishAfterCommit(() -> {
            try {
                publishToDevice(cmd);
            } catch (Exception e) {
                asyncDb.markJobStatus(jobId, "FAILED");
                asyncDb.updateLog(logHead.getId(), "PUBLISH_FAILED", e.toString());
                CompletableFuture<ResponseDto.ManufactureResponseDto> f = mfFutureByDevice.remove(deviceId);
                if (f != null) f.completeExceptionally(new RuntimeException("publish failed", e));
            }
        });

        timeout(fut, 60, TimeUnit.SECONDS, () -> {
            mfFutureByDevice.values().removeIf(v -> v == fut);
            mfWaitByJob.values().removeIf(v -> v == fut);
            asyncDb.markJobStatus(jobId, "FAILED");
            asyncDb.updateLog(logHead.getId(), "TIMEOUT", "no ack within 60s");
            fut.completeExceptionally(new TimeoutException("manufacture timeout"));
        });

        lastJobIdByDevice.put(deviceId, jobId);

        return fut;
    }


    // =========================================================
    // CHECK
    // =========================================================
    public CompletableFuture<ResponseDto.CheckResponseDto> checkAsync(String deviceId) {
        if (checkFutureByDevice.putIfAbsent(deviceId, new CompletableFuture<>()) != null) {
            throw new IllegalStateException("check in-flight for device " + deviceId);
        }
        CompletableFuture<ResponseDto.CheckResponseDto> fut = checkFutureByDevice.get(deviceId);

        PerfumeCommand.PerfumeCommandRequest cmd = PerfumeCommand.PerfumeCommandRequest.check();
        try {
            publishToDevice(cmd);
        } catch (Exception e) {
            asyncDb.appendLog(deviceId, null, "check", "PUBLISH_FAILED", e.toString());
            CompletableFuture<ResponseDto.CheckResponseDto> f = checkFutureByDevice.remove(deviceId);
            if (f != null) f.completeExceptionally(new RuntimeException("publish failed", e));
            return fut;
        }
        timeout(fut, 30, TimeUnit.SECONDS, () -> {
            CompletableFuture<ResponseDto.CheckResponseDto> f = checkFutureByDevice.remove(deviceId);
            asyncDb.appendLog(deviceId, null, "check", "TIMEOUT", "no ack within 30s");
            if (f != null) f.completeExceptionally(new TimeoutException("check timeout"));
        });
        return fut;
    }

    // =========================================================
    // CONNECT
    // =========================================================
    @Transactional
    public CompletableFuture<ResponseDto.ConnectResponseDto> connectAsync(String deviceId) {
        endpointRepo.ensureExists(deviceId);

        if (connectFutureByDevice.putIfAbsent(deviceId, new CompletableFuture<>()) != null) {
            throw new IllegalStateException("connect in-flight for device " + deviceId);
        }
        CompletableFuture<ResponseDto.ConnectResponseDto> fut = connectFutureByDevice.get(deviceId);

        PerfumeCommand.PerfumeCommandRequest cmd = PerfumeCommand.PerfumeCommandRequest.connect();

        publishAfterCommit(() -> {
            try {
                publishToDevice(cmd);
            } catch (Exception e) {
                CompletableFuture<ResponseDto.ConnectResponseDto> f = connectFutureByDevice.remove(deviceId);
                if (f != null) f.completeExceptionally(new RuntimeException("publish failed", e));
            }
        });

        timeout(fut, 30, TimeUnit.SECONDS, () -> {
            CompletableFuture<ResponseDto.ConnectResponseDto> f = connectFutureByDevice.remove(deviceId);
            if (f != null) f.completeExceptionally(new TimeoutException("connect timeout"));
        });

        return fut;
    }

    // MQTT 수신 분기 처리
    public void handleInbound(String deviceId, String payload) {
        try {
            JsonNode root = om.readTree(payload);
            String cmdRaw = root.path("CMD").asText(null);
            if (cmdRaw == null) {
                log.warn("invalid inbound (no CMD): {}", payload);
                return;
            }
            String cmd = cmdRaw.toLowerCase();
            log.info("[IN] cmd={} payload={}", cmd, payload);

            switch (cmd) {
                // -----------------------------------------------------
                // CHECK 응답: data는 재고 목록
                // -----------------------------------------------------
                case "check": {
                    CompletableFuture<ResponseDto.CheckResponseDto> fut =
                            checkFutureByDevice.computeIfAbsent(deviceId, k -> new CompletableFuture<>());

                    List<Ingredient> ingredients = toIngredientList(root.path("data"));
                    for (Ingredient ing : ingredients) {
                        slotRepo.ensureSlot(deviceId, ing.getSlotId(), ing.getNoteName());
                        asyncDb.upsertStock(deviceId, ing.getSlotId(), ing.getCurrentAmount());
                        cacheStock.put(ing.getSlotId(), ing.getCurrentAmount());
                    }
                    ResponseDto.CheckResponseDto.CheckData data =
                            new ResponseDto.CheckResponseDto.CheckData(deviceId, 8L, ingredients);

                    fut.complete(new ResponseDto.CheckResponseDto(true, data));
                    checkFutureByDevice.remove(deviceId, fut);
                    break;
                }

                // -----------------------------------------------------
                // UPDATE 응답: data.status 등 간단 ACK
                // -----------------------------------------------------
                case "check_response": {
                    CompletableFuture<ResponseDto.UpdateResponseDto> fut =
                            updateFutureByDevice.computeIfAbsent(deviceId, k -> new CompletableFuture<>());

                    String status = optText(root.path("data"), "status");
                    Long lid = updateLogIdByDevice.remove(deviceId);
                    if (lid != null) asyncDb.updateLog(lid, "ACKED", "status=" + status);
                    else asyncDb.appendLog(deviceId, null, "update", "ACK", "status=" + status);
                    Long targetId = jobRepo
                            .findTopByDeviceIdAndStatusOrderByCreatedAtDesc(deviceId, "CREATED")
                            .map(MfJob::getId)
                            .orElseThrow(() -> new RuntimeException("최근에 성공한 레시피가 없습니다."));
                    List<Long> ingredientIds = recipeRepo.findAllIngredientIdsByJobId(targetId);
                    List<NoteAmountDto> noteAmounts = noteInvRepo.findNoteIdAndAmountByNoteIds(ingredientIds);
                    List<Ingredient> ingredients = noteAmounts.stream()
                            .map(dto -> Ingredient.builder()
                                    .noteId(dto.getNoteId())
                                    .currentAmount(dto.getAmount())
                                    .build()
                            )
                            .toList();

                    ResponseDto.UpdateResponseDto.UpdateData data = new ResponseDto.UpdateResponseDto.UpdateData(ingredients, LocalDateTime.now());
                    fut.complete(new ResponseDto.UpdateResponseDto(true, data));
                    updateFutureByDevice.remove(deviceId, fut);
                    break;
                }

                // -----------------------------------------------------
                // MANUFACTURE 진행/완료 상태
                // -----------------------------------------------------
                case "status": {
                    Long jobId = lastJobIdByDevice.get(deviceId);
                    if (jobId == null) {
                        log.warn("[STATUS] No jobId mapping for device={}", deviceId);
                        break;
                    }
                    String status = optText(root.path("data"), "status");
                    String normalized = (status == null) ? "unknown" : status.toLowerCase();

                    switch (normalized) {
                        case "possible" -> {
                            asyncDb.markJobStatus(jobId,"PREPARE");
                            jobStartedAt.putIfAbsent(String.valueOf(jobId), LocalDateTime.now());
                            safeUpdateMfLog(jobId, "POSSIBLE", "");

                            asyncDb.consumeForManufacture(jobId, deviceId, 2.0);
                        }
                        case "completed" -> {
                            asyncDb.markJobStatus(jobId, "COMPLETED");
                            safeUpdateMfLog(jobId, "COMPLETED", "");

                            String devId = jobRepo.findDeviceIdById(jobId);
                            webSocketNotifier.sendManufactureStatus(devId, jobId, "COMPLETED");
                        }
                        case "impossible", "error" -> {
                            asyncDb.markJobStatus(jobId, "FAILED");
                            safeUpdateMfLog(jobId, "FAILED", status);
                        }
                        default -> safeUpdateMfLog(jobId, "UNKNOWN", status);
                    }

                    if (String.valueOf(jobId) != null && !mfWaitByJob.containsKey(String.valueOf(jobId))) {
                        CompletableFuture<ResponseDto.ManufactureResponseDto> devFut =
                                mfFutureByDevice.computeIfAbsent(deviceId, k -> new CompletableFuture<>());
                        mfWaitByJob.put(String.valueOf(jobId), devFut);
                        mfFutureByDevice.remove(deviceId, devFut);
                    }

                    if (String.valueOf(jobId) != null &&
                            ("completed".equalsIgnoreCase(normalized)
                                    || "failed".equalsIgnoreCase(normalized)
                                    || "error".equalsIgnoreCase(normalized))) {

                        CompletableFuture<ResponseDto.ManufactureResponseDto> fut =
                                mfWaitByJob.remove(String.valueOf(jobId));

                        if (fut == null) {
                            fut = mfFutureByDevice.computeIfAbsent(deviceId, k -> new CompletableFuture<>());
                            mfFutureByDevice.remove(deviceId, fut);
                        }

                        var m = new ResponseDto.ManufactureResponseDto.ManufactureData();
                        m.setJobId(String.valueOf(jobId));
                        m.setStatus(status);
                        m.setStartedAt(jobStartedAt.getOrDefault(String.valueOf(jobId), LocalDateTime.now()));
                        lastJobIdByDevice.remove(deviceId);
                        fut.complete(new ResponseDto.ManufactureResponseDto(true, m));

                        jobStartedAt.remove(String.valueOf(jobId));
                        mfLogIdByJob.remove(String.valueOf(jobId));
                    }
                    break;
                }

                case "connect": {
                    CompletableFuture<ResponseDto.ConnectResponseDto> fut =
                            connectFutureByDevice.computeIfAbsent(deviceId, k -> new CompletableFuture<>());

                    var connectData = ResponseDto.ConnectResponseDto.ConnectData.builder()
                            .deviceId(deviceId)
                            .responseCMDType(ResponseCMDType.connect)
                            .status("connected")
                            .build();

                    fut.complete(new ResponseDto.ConnectResponseDto(true, connectData));
                    connectFutureByDevice.remove(deviceId, fut);
                    break;
                }


                default:
                    log.info("[MQTT IN] Unhandled cmd={}", cmd);
            }
        } catch (Exception e) {
            log.warn("inbound parse error in handleInbound", e);
        }
    }

    // =========================================================
    // 변환 헬퍼
    // =========================================================
    private List<Ingredient> toIngredientList(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return List.of();
        List<Ingredient> out = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode n : node) out.add(toIngredient(n));
        } else if (node.isObject()) {
            JsonNode items = node.has("ingredients") ? node.get("ingredients")
                    : (node.has("items") ? node.get("items") : node);
            if (items != null && items.isArray()) {
                for (JsonNode n : items) out.add(toIngredient(n));
            }
        }
        return out;
    }

    private Ingredient toIngredient(JsonNode n) {
        long slotId = num(n, "slotId", "SlotId");
        long ingId = numL(n, "ingredientId", "noteId");
        String name = txt(n, "name", "noteName");
        double amt = num(n, "currentAmount", "amount", "capacity");
        return new Ingredient(slotId, ingId, name, amt);
    }

    private static String txt(JsonNode n, String... ks) {
        for (String k : ks) if (n.has(k) && !n.get(k).isNull()) return n.get(k).asText();
        return null;
    }
    private static int num(JsonNode n, String... ks) {
        for (String k : ks) if (n.has(k) && n.get(k).isNumber()) return n.get(k).asInt();
        return 0;
    }
    private static long numL(JsonNode n, String... ks) {
        for (String k : ks) if (n.has(k) && n.get(k).isNumber()) return n.get(k).asLong();
        return 0L;
    }
    private static String optText(JsonNode n, String k) {
        return n.has(k) && !n.get(k).isNull() ? n.get(k).asText(null) : null;
    }

    private void safeUpdateMfLog(Long jobId, String event, String message) {
        try {
            Long lid = mfLogIdByJob.get(String.valueOf(jobId));
            if (lid != null) {
                asyncDb.updateLog(lid, event, message);
                return;
            }

            String devId = jobRepo.findDeviceIdById(jobId);
            if (devId == null) devId = "";

            asyncDb.appendLog(devId, jobId, "manufacture", event, message);
        } catch (Exception e) {
            log.warn("mf log update failed jobId={}, event={}", jobId, event, e);
        }
    }

    @Transactional(readOnly = true)
    public ResponseDto.StatusResponseDto getDeviceStatus(String deviceId) {
        endpointRepo.ensureExists(deviceId);

        LocalDateTime lastActivity = logRepo.findLastActivity(deviceId).orElse(null);

        Long currentJob = jobRepo.findLastInProgressJobId(deviceId, List.of("PREPARE"))
                .orElse(null);

        MachineStatus status = (currentJob != null) ? MachineStatus.possible
                : MachineStatus.impossible; // 필요시 조건 강화

        var data = ResponseDto.StatusResponseDto.StatusData.builder()
                .deviceId(deviceId)
                .machineStatus(status)
                .currentJob(currentJob)
                .lastActivity(lastActivity)
                .build();

        return new ResponseDto.StatusResponseDto(true, data);
    }

    public DashboardStatsDto getStats(String deviceId) {
        long total = jobRepo.countAll(deviceId);
        long completed = jobRepo.countCompleted(deviceId);
        int successRate = (total == 0) ? 0 : (int)Math.round(completed * 100.0 / total);

        Long totalSec = logRepo.sumManufacturingSeconds(deviceId);
        long totalManufacturingTime = (totalSec == null) ? 0L : totalSec;

        var raw = jobRepo.monthlyStats(deviceId);
        var monthly = new java.util.ArrayList<DashboardStatsDto.MonthlyStat>(raw.size());
        for (Object[] r : raw) {
            String ym = (String) r[0];
            Number cnt = (Number) r[1];
            monthly.add(DashboardStatsDto.MonthlyStat.builder()
                    .month(ym)
                    .jobCount(cnt == null ? 0 : cnt.longValue())
                    .build());
        }

        return DashboardStatsDto.builder()
                .totalJobs(total)
                .completedJobs(completed)
                .successRate(successRate)
                .totalManufacturingTime(totalManufacturingTime)
                .monthlyStats(monthly)
                .build();
    }

    @PreDestroy
    public void shutdownScheduler() {
        scheduler.shutdownNow();
    }

    @Transactional
    public ResponseDto.CheckResponseDto checkFromDb(String deviceId) {
        endpointRepo.ensureExists(deviceId);

        String sql = """
        SELECT s.slot_id, sn.note_id, sn.note_name, st.amount
          FROM device_slot s
          LEFT JOIN device_slot_note sn
            ON sn.device_id = s.device_id AND sn.slot_id = s.slot_id
          LEFT JOIN device_stock st
            ON st.device_id = s.device_id AND st.slot_id = s.slot_id
         WHERE s.device_id = :deviceId
         ORDER BY s.slot_id
    """;

        @SuppressWarnings("unchecked")
        var rows = (java.util.List<Object[]>) em.createNativeQuery(sql)
                .setParameter("deviceId", deviceId)
                .getResultList();

        var ingredients = new java.util.ArrayList<Ingredient>(rows.size());
        for (Object[] r : rows) {
            long   slotId   = ((Number) r[0]).longValue();
            Long   noteId   = (r[1] == null) ? null : ((Number) r[1]).longValue();
            String noteName = (String) r[2];
            double amount   = (r[3] == null) ? 0d : ((Number) r[3]).doubleValue();
            ingredients.add(new Ingredient(slotId, noteId == null ? 0L : noteId, noteName, amount));
        }

        long slotCount = 8L;
        var data = new ResponseDto.CheckResponseDto.CheckData(deviceId, slotCount, ingredients);
        return new ResponseDto.CheckResponseDto(true, data);
    }

}
