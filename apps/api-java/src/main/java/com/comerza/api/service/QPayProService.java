package com.comerza.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class QPayProService {

    private final RestClient restClient;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.api.url:http://localhost:8080/api}")
    private String apiUrl;

    public QPayProService() {
        this.restClient = RestClient.create("https://payments.qpaypro.com/checkout");
    }

    public String createPaymentLink(String apiKey, String apiSecret, double amount, String description, String reference,
                                    String customerName, String customerEmail, String customerPhone,
                                    List<Map<String, Object>> items) {
        
        if (apiKey == null || apiSecret == null) {
            throw new RuntimeException("Las llaves de QPayPro no están configuradas completamente para este comercio.");
        }

        String safeCustomerName = customerName != null ? customerName : "Consumidor Final";
        String[] nameParts = safeCustomerName.split(" ");
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? safeCustomerName.substring(firstName.length()).trim() : "Final";

        Map<String, Object> payload = Map.ofEntries(
                Map.entry("x_login", apiKey),
                Map.entry("x_api_key", apiSecret),
                Map.entry("x_amount", String.format("%.2f", amount)),
                Map.entry("x_currency_code", "GTQ"),
                Map.entry("x_first_name", firstName),
                Map.entry("x_last_name", lastName),
                Map.entry("x_phone", customerPhone != null ? customerPhone : "00000000"),
                Map.entry("x_description", description),
                Map.entry("x_reference", reference),
                Map.entry("x_url_cancel", frontendUrl + "/pago/fallido"),
                Map.entry("x_company", "C/F"),
                Map.entry("x_address", "Ciudad"),
                Map.entry("x_city", "Guatemala"),
                Map.entry("x_country", "GT"),
                Map.entry("x_state", "GU"),
                Map.entry("x_zip", "01001"),
                Map.entry("x_freight", "0.00"),
                Map.entry("x_email", customerEmail != null ? customerEmail : "correo@ejemplo.com"),
                Map.entry("x_type", "AUTH_ONLY"),
                Map.entry("x_method", "CC"),
                Map.entry("x_invoice_num", reference.length() > 8 ? reference.substring(0, 8) : reference),
                Map.entry("custom_fields", Map.of()),
                Map.entry("x_visacuotas", "no"),
                Map.entry("x_relay_url", apiUrl + "/qpaypro/relay/" + reference),
                Map.entry("products", items.stream().map(item -> new Object[]{
                        item.get("name"),
                        ((String)item.get("id")).length() > 8 ? ((String)item.get("id")).substring(0, 8) : item.get("id"),
                        "",
                        item.get("quantity"),
                        String.format("%.2f", item.get("price")),
                        String.format("%.2f", ((Number)item.get("quantity")).doubleValue() * ((Number)item.get("price")).doubleValue())
                }).collect(Collectors.toList())),
                Map.entry("taxes", "0.00"),
                Map.entry("http_origin", frontendUrl),
                Map.entry("origen", "comerza-app"),
                Map.entry("store_type", "COMERZA")
        );

        try {
            Map<String, Object> response = restClient.post()
                    .uri("/register_transaction_store")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            if (response != null && ("error".equals(response.get("status")) || "error".equals(response.get("estado")))) {
                throw new RuntimeException("QPayPro reportó un error: " + response.get("message"));
            }

            String token = null;
            if (response != null && response.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                token = (String) data.get("token");
            }
            if (token == null && response != null) token = (String) response.get("token");
            if (token == null && response != null) token = (String) response.get("id");

            if (token == null) {
                throw new RuntimeException("QPayPro no devolvió un token válido.");
            }

            return "https://payments.qpaypro.com/checkout/store?token=" + token;

        } catch (Exception e) {
            log.error("Error generando link de pago: ", e);
            throw new RuntimeException("Error de QPayPro: " + e.getMessage());
        }
    }
}
