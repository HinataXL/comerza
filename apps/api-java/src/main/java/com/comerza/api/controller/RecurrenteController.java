package com.comerza.api.controller;

import com.comerza.api.entity.Sale;
import com.comerza.api.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/recurrente")
@RequiredArgsConstructor
public class RecurrenteController {

    private final SaleRepository saleRepository;

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Recibido webhook de Recurrente: {}", payload);
        
        try {
            // El webhook de Recurrente o la sesión de terminal suele enviar el external_id asociado al pago
            String saleId = null;
            
            if (payload.containsKey("external_id")) {
                saleId = String.valueOf(payload.get("external_id"));
            } else if (payload.containsKey("data")) {
                // Dependiendo de la versión de la API
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                if (data != null && data.containsKey("external_id")) {
                    saleId = String.valueOf(data.get("external_id"));
                } else if (data != null && data.containsKey("metadata")) {
                    Map<String, Object> metadata = (Map<String, Object>) data.get("metadata");
                    if (metadata != null && metadata.containsKey("external_id")) {
                        saleId = String.valueOf(metadata.get("external_id"));
                    }
                }
            }

            if (saleId != null) {
                // Buscamos la venta sin importar el tenant, ya que es un callback externo
                Sale sale = saleRepository.findById(saleId).orElse(null);
                if (sale != null && "PENDING".equals(sale.getStatus())) {
                    sale.setStatus("COMPLETED");
                    saleRepository.save(sale);
                    log.info("Venta {} actualizada a COMPLETED mediante webhook de Recurrente", saleId);
                }
            }
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error procesando webhook de Recurrente: {}", e.getMessage());
            return ResponseEntity.ok().build(); // Siempre responder 200 al webhook para que no reintente infinitamente
        }
    }
}
