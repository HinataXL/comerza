package com.comerza.api.controller;

import com.comerza.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    @GetMapping("/whatsapp")
    public ResponseEntity<String> verifyWhatsAppWebhook() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping(value = "/whatsapp", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE, produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> handleWhatsAppWebhook(@RequestParam Map<String, String> payload) {
        String from = payload.get("From");
        String body = payload.get("Body");

        if (from == null || body == null) {
            return ResponseEntity.badRequest().body("<Response></Response>");
        }

        // Extraer el número de teléfono sin el prefijo "whatsapp:+" o "+"
        String phoneNumber = from.replace("whatsapp:", "").replace("+", "");
        String textBody = body.trim().toUpperCase();

        String actionStr;
        if ("CONFIRMAR".equals(textBody)) {
            actionStr = "CONFIRMED";
        } else if ("CANCELAR".equals(textBody)) {
            actionStr = "CANCELLED";
        } else {
            // No es una palabra clave reconocida, ignoramos
            return ResponseEntity.ok("<Response></Response>");
        }

        try {
            // Utilizamos JdbcTemplate porque Reservation Entity podría no estar completamente migrada aún,
            // permitiendo que el webhook funcione con la base de datos actual.
            String query = "SELECT r.id, r.tenant_id, c.name FROM reservations r " +
                           "JOIN customers c ON r.customer_id = c.id " +
                           "WHERE r.status = 'PENDING' AND c.phone LIKE ? " +
                           "ORDER BY r.created_at DESC LIMIT 1";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(query, "%" + phoneNumber + "%");
            
            if (results.isEmpty()) {
                // No se encontró reservación pendiente para este número
                return ResponseEntity.ok("<Response></Response>");
            }

            Map<String, Object> recentReservation = results.get(0);
            String reservationId = (String) recentReservation.get("id");
            String tenantId = (String) recentReservation.get("tenant_id");
            String customerName = (String) recentReservation.get("name");

            // Actualizar estado
            jdbcTemplate.update("UPDATE reservations SET status = ? WHERE id = ?", actionStr, reservationId);

            // Preparar notificación
            String msg = "CONFIRMED".equals(actionStr)
                    ? "El cliente " + customerName + " ha confirmado su reservación vía WhatsApp (Twilio)."
                    : "El cliente " + customerName + " ha cancelado su reservación vía WhatsApp (Twilio).";
            
            String title = "CONFIRMED".equals(actionStr) ? "Reservación Confirmada" : "Reservación Cancelada";
            String type = "CONFIRMED".equals(actionStr) ? "SUCCESS" : "WARNING";

            // Enviar notificación (SSE/Realtime)
            notificationService.broadcastGlobalNotification(title, msg, type);

            // Guardar notificación en DB (PostgreSQL)
            jdbcTemplate.update("INSERT INTO notifications (id, tenant_id, title, message, type, created_at, expires_at) " +
                    "VALUES (gen_random_uuid(), ?, ?, ?, ?, NOW(), NOW() + INTERVAL '30 days')", 
                    tenantId, title, msg, type);

            log.info("Reservación {} actualizada a {} exitosamente vía Twilio.", reservationId, actionStr);

            // Responder a Twilio para enviar un mensaje de vuelta al cliente
            String replyMessage = "CONFIRMED".equals(actionStr)
                    ? "¡Gracias! Tu reservación ha sido confirmada con éxito."
                    : "Tu reservación ha sido cancelada.";

            return ResponseEntity.ok("<Response><Message>" + replyMessage + "</Message></Response>");
            
        } catch (Exception e) {
            log.error("Error handling Twilio WhatsApp webhook: {}", e.getMessage());
            // Para Twilio siempre regresamos 200 con o sin error para evitar que reintente infinitamente
            return ResponseEntity.ok("<Response></Response>"); 
        }
    }
}
