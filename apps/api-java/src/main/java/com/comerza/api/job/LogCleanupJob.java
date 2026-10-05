package com.comerza.api.job;

import com.comerza.api.repository.SystemLogRepository;
import com.comerza.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class LogCleanupJob {

    private final SystemLogRepository systemLogRepository;
    private final EmailService emailService;

    // Ejecutar todos los días a las 3:00 AM (Segundos, Minutos, Horas, Día del mes, Mes, Día de la semana)
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional // Requerido porque la operación deleteBy es modificadora
    public void cleanupOldLogs() {
        log.info("Iniciando limpieza automática de logs antiguos...");

        try {
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

            long deletedCount = systemLogRepository.deleteByCreatedAtBefore(thirtyDaysAgo);

            String message = String.format("Limpieza completada. Se eliminaron %d logs antiguos (más de 30 días).", deletedCount);
            log.info(message);

            emailService.sendCronExecutionEmail(
                    "erick.pedroza@fixss.com",
                    String.format("[Cron] Limpieza de System Logs (%d eliminados)", deletedCount),
                    message
            );

        } catch (Exception e) {
            log.error("Error al ejecutar la limpieza de logs", e);
        }
    }
}
