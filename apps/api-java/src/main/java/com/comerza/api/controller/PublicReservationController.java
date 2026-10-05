package com.comerza.api.controller;

import com.comerza.api.entity.Reservation;
import com.comerza.api.repository.ReservationRepository;
import com.comerza.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public/reservation")
@RequiredArgsConstructor
public class PublicReservationController {

    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;

    @GetMapping("/{token}")
    public ResponseEntity<Map<String, Object>> getReservationByToken(@PathVariable String token) {
        Optional<Reservation> opt = reservationRepository.findByActionToken(token);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Reservation r = opt.get();
        Map<String, Object> result = new HashMap<>();
        result.put("id", r.getId());
        result.put("status", r.getStatus());
        result.put("title", r.getTitle());
        result.put("notes", r.getNotes());
        result.put("startTime", r.getStartTime().toString() + "Z");
        result.put("endTime", r.getEndTime().toString() + "Z");
        result.put("tenantName", r.getTenant().getName());
        result.put("customerName", r.getCustomer().getName());
        return ResponseEntity.ok(result);
    }

    // POST /api/public/reservation/{token}/action
    // body: { "action": "confirm" | "reject" | "reschedule", "requestedDate": "..." (optional for reschedule) }
    @PostMapping("/{token}/action")
    public ResponseEntity<Map<String, Object>> performAction(
            @PathVariable String token,
            @RequestBody Map<String, Object> body) {

        Optional<Reservation> opt = reservationRepository.findByActionToken(token);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Reservation reservation = opt.get();
        String action = (String) body.get("action");

        if (action == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "action is required"));
        }

        switch (action) {
            case "confirm":
                reservation.setStatus("CONFIRMED");
                reservationRepository.save(reservation);
                notificationService.broadcastGlobalNotification(
                    "✅ Reservación Confirmada",
                    reservation.getCustomer().getName() + " confirmó su cita del " + reservation.getStartTime().toLocalDate(),
                    "SUCCESS"
                );
                return ResponseEntity.ok(Map.of("status", "CONFIRMED", "message", "Reservación confirmada"));

            case "reject":
                reservation.setStatus("CANCELLED");
                reservationRepository.save(reservation);
                notificationService.broadcastGlobalNotification(
                    "❌ Reservación Cancelada",
                    reservation.getCustomer().getName() + " canceló su cita del " + reservation.getStartTime().toLocalDate(),
                    "ERROR"
                );
                return ResponseEntity.ok(Map.of("status", "CANCELLED", "message", "Reservación cancelada"));

            case "reschedule":
                String requestedDate = (String) body.get("requestedDate");
                String requestedNote = body.containsKey("note") ? (String) body.get("note") : "";

                // Mark as PENDING_RESCHEDULE and notify the business
                reservation.setStatus("PENDING_RESCHEDULE");
                if (requestedNote != null && !requestedNote.isEmpty()) {
                    String currentNotes = reservation.getNotes() != null ? reservation.getNotes() : "";
                    reservation.setNotes(currentNotes + "\n[Reprogramar]: " + requestedNote + (requestedDate != null ? " — Fecha preferida: " + requestedDate : ""));
                }
                reservationRepository.save(reservation);

                String rescheduleMsg = reservation.getCustomer().getName() + " solicita reprogramar su cita del " +
                        reservation.getStartTime().toLocalDate() +
                        (requestedDate != null && !requestedDate.isEmpty() ? ". Fecha preferida: " + requestedDate : "");

                notificationService.broadcastGlobalNotification(
                    "📆 Solicitud de Reprogramación",
                    rescheduleMsg,
                    "WARNING"
                );
                return ResponseEntity.ok(Map.of("status", "PENDING_RESCHEDULE", "message", "Solicitud enviada al comercio"));

            default:
                return ResponseEntity.badRequest().body(Map.of("message", "Acción no válida: " + action));
        }
    }
}
