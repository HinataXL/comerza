package com.comerza.api.controller;

import com.comerza.api.entity.Customer;
import com.comerza.api.entity.Reservation;
import com.comerza.api.entity.Tenant;
import com.comerza.api.repository.CustomerRepository;
import com.comerza.api.repository.ReservationRepository;
import com.comerza.api.repository.TenantRepository;
import com.comerza.api.security.UserDetailsImpl;
import com.comerza.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;
    private final TenantRepository tenantRepository;
    private final EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getReservations(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        String tenantId = userDetails.getUser().getTenant().getId();
        List<Reservation> reservations = reservationRepository.findByTenantIdOrderByStartTimeDesc(tenantId);
        
        List<Map<String, Object>> result = reservations.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("title", r.getTitle());
            map.put("customerId", r.getCustomer().getId());
            map.put("customer", Map.of(
                "id", r.getCustomer().getId(),
                "name", r.getCustomer().getName()
            ));
            
            // Format to match JS Date string (ISO 8601 without offset if treated locally, but standard is Z)
            map.put("startTime", r.getStartTime().toString() + "Z");
            map.put("endTime", r.getEndTime().toString() + "Z");
            
            map.put("status", r.getStatus());
            map.put("notes", r.getNotes());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createReservation(@RequestBody Map<String, Object> request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String customerId = (String) request.get("customerId");
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

        Tenant tenant = tenantRepository.findById(userDetails.getUser().getTenant().getId())
            .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Reservation reservation = new Reservation();
        reservation.setTenant(tenant);
        reservation.setCustomer(customer);
        reservation.setTitle((String) request.get("title"));
        
        // Parse dates from ISO string (e.g. 2026-10-04T12:00:00.000Z)
        String startTimeStr = (String) request.get("startTime");
        String endTimeStr = (String) request.get("endTime");
        
        // Strip the Z if it exists for LocalDateTime parse
        if (startTimeStr.endsWith("Z")) startTimeStr = startTimeStr.substring(0, startTimeStr.length() - 1);
        if (endTimeStr.endsWith("Z")) endTimeStr = endTimeStr.substring(0, endTimeStr.length() - 1);
        
        reservation.setStartTime(LocalDateTime.parse(startTimeStr));
        reservation.setEndTime(LocalDateTime.parse(endTimeStr));
        
        reservation.setStatus(request.containsKey("status") ? (String) request.get("status") : "PENDING");
        reservation.setNotes((String) request.get("notes"));

        reservation = reservationRepository.save(reservation);

        // Disparar la notificación por correo
        if (customer.getEmail() != null && !customer.getEmail().isEmpty()) {
            try {
                emailService.sendReservationEmail(reservation, frontendBaseUrl);
            } catch (Exception e) {
                // Si falla el correo, no deberíamos bloquear el guardado exitoso
                System.err.println("Failed to send email: " + e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>(request);
        response.put("id", reservation.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getReservation(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Reservation r = reservationRepository.findById(id).orElseThrow();
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("title", r.getTitle());
        map.put("status", r.getStatus());
        map.put("notes", r.getNotes());
        return ResponseEntity.ok(map);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateReservation(@PathVariable String id, @RequestBody Map<String, Object> request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Reservation reservation = reservationRepository.findById(id).orElseThrow();
        
        if (request.containsKey("title")) reservation.setTitle((String) request.get("title"));
        if (request.containsKey("status")) reservation.setStatus((String) request.get("status"));
        if (request.containsKey("notes")) reservation.setNotes((String) request.get("notes"));
        
        if (request.containsKey("startTime")) {
            String startTimeStr = (String) request.get("startTime");
            if (startTimeStr.endsWith("Z")) startTimeStr = startTimeStr.substring(0, startTimeStr.length() - 1);
            reservation.setStartTime(LocalDateTime.parse(startTimeStr));
        }
        
        if (request.containsKey("endTime")) {
            String endTimeStr = (String) request.get("endTime");
            if (endTimeStr.endsWith("Z")) endTimeStr = endTimeStr.substring(0, endTimeStr.length() - 1);
            reservation.setEndTime(LocalDateTime.parse(endTimeStr));
        }

        reservation = reservationRepository.save(reservation);
        
        return ResponseEntity.ok(Map.of("id", reservation.getId(), "status", reservation.getStatus()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateReservationStatus(@PathVariable String id, @RequestBody Map<String, String> request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Reservation reservation = reservationRepository.findById(id).orElseThrow();
        reservation.setStatus(request.getOrDefault("status", "CONFIRMED"));
        reservationRepository.save(reservation);
        return ResponseEntity.ok(Map.of("id", id, "status", reservation.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        reservationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
