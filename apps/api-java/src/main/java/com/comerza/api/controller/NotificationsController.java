package com.comerza.api.controller;

import com.comerza.api.security.UserDetailsImpl;
import com.comerza.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationsController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<?>> getNotifications(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(notificationService.getActiveNotifications());
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        notificationService.addEmitter(emitter);
        
        try {
            // Enviamos un ping inicial para que el frontend establezca la conexión
            emitter.send(SseEmitter.event().name("ping").data("{}"));
        } catch (Exception e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@org.springframework.web.bind.annotation.PathVariable String id) {
        // Por ahora, como las notificaciones globales están en memoria para todos, 
        // simplemente devolvemos OK para que el frontend la oculte localmente.
        return ResponseEntity.ok().build();
    }
}
