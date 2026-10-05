package com.comerza.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
public class RecurrenteService {

    private final RestClient restClient;

    public RecurrenteService() {
        // Inicializa el cliente moderno de Spring (Spring Boot 3.2+)
        this.restClient = RestClient.create("https://app.recurrente.com/api");
    }

    public Map<String, Object> createTerminalSessionCommand(String secretKey, String terminalId, double amount, String externalId) {
        long amountInCents = Math.round(amount * 100);

        Map<String, Object> payload = Map.of(
                "terminal_id", terminalId,
                "currency", "GTQ",
                "external_id", externalId,
                "amount_in_cents", amountInCents,
                "show_post_payment_screens", true
        );

        try {
            return restClient.post()
                    .uri("/terminal_session_commands")
                    .header("X-SECRET-KEY", secretKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    // Si el status no es 2xx, RestClient lanzará una excepción automáticamente
                    .body(Map.class);
        } catch (Exception e) {
            log.error("Recurrente API Error: {}", e.getMessage());
            throw new RuntimeException("Recurrente API Error: " + e.getMessage());
        }
    }
}
