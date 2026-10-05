package com.comerza.api.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.CopyOnWriteArrayList;
import java.time.LocalDateTime;

@Service
public class NotificationService {
    
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> activeNotifications = new CopyOnWriteArrayList<>();

    public void addEmitter(SseEmitter emitter) {
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));
    }

    public void broadcastGlobalNotification(String title, String message, String type) {
        Map<String, Object> notification = Map.of(
            "id", java.util.UUID.randomUUID().toString(),
            "title", title,
            "message", message,
            "type", type != null ? type : "INFO",
            "createdAt", LocalDateTime.now().toString(),
            "expiresAt", LocalDateTime.now().plusHours(12).toString()
        );
        
        activeNotifications.add(notification);

        // Remove expired
        activeNotifications.removeIf(n -> 
            LocalDateTime.parse((String)n.get("expiresAt")).isBefore(LocalDateTime.now())
        );

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(notification));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }

    public List<Map<String, Object>> getActiveNotifications() {
        // Remove expired before returning
        activeNotifications.removeIf(n -> 
            LocalDateTime.parse((String)n.get("expiresAt")).isBefore(LocalDateTime.now())
        );
        return new ArrayList<>(activeNotifications);
    }
}
