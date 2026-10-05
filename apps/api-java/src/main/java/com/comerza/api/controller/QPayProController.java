package com.comerza.api.controller;

import com.comerza.api.entity.Sale;
import com.comerza.api.repository.SaleRepository;
import com.comerza.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

@Slf4j
@Controller
@RequestMapping("/api/qpaypro")
@RequiredArgsConstructor
public class QPayProController {

    private final SaleRepository saleRepository;
    private final EmailService emailService;

    // Inyecta el valor desde application.yml (o usa localhost:3000 por defecto)
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @RequestMapping(value = "/relay/{saleId}", method = {RequestMethod.GET, RequestMethod.POST})
    public RedirectView handleRelay(
            @PathVariable("saleId") String saleId,
            @RequestParam(value = "x_response_status", required = false) String queryStatus,
            @RequestBody(required = false) Map<String, String> body) {

        String xResponseStatus = queryStatus;
        if (xResponseStatus == null && body != null) {
            xResponseStatus = body.get("x_response_status");
        }

        log.info("QPayPro Relay received for sale {}: status={}", saleId, xResponseStatus);
        
        String cleanFrontendUrl = frontendUrl.replaceAll("/$", "");
        
        try {
            // Buscamos la venta. Gracias al @EntityGraph en el repositorio, 
            // esto trae automáticamente al customer y los items.
            Sale sale = saleRepository.findById(saleId).orElse(null);

            if (sale != null) {
                if ("1".equals(xResponseStatus)) {
                    if ("PENDING".equals(sale.getStatus())) {
                        
                        sale.setStatus("COMPLETED");
                        saleRepository.save(sale); // Actualizamos en BD
                        
                        log.info("Sale {} automatically marked as COMPLETED via QPayPro Relay", sale.getId());

                        if (sale.getCustomer() != null && sale.getCustomer().getEmail() != null) {
                            try {
                                emailService.sendPaymentReceiptEmail(sale);
                            } catch (Exception e) {
                                log.error("Error sending payment receipt email for sale {}: {}", sale.getId(), e.getMessage());
                            }
                        }
                    }
                } else if (xResponseStatus != null) {
                    if ("PENDING".equals(sale.getStatus())) {
                        sale.setStatus("FAILED");
                        saleRepository.save(sale);
                        log.info("Sale {} automatically marked as FAILED via QPayPro Relay", sale.getId());
                    }
                }
            }

            // Redirección condicional equivalente a Express res.redirect()
            if (sale != null && "COMPLETED".equals(sale.getStatus())) {
                return new RedirectView(cleanFrontendUrl + "/pago/exitoso?saleId=" + saleId);
            } else if (sale != null && ("FAILED".equals(sale.getStatus()) || !"1".equals(xResponseStatus))) {
                return new RedirectView(cleanFrontendUrl + "/pago/fallido?saleId=" + saleId);
            } else {
                return new RedirectView(cleanFrontendUrl);
            }

        } catch (Exception e) {
            log.error("Error handling QPayPro relay:", e);
            return new RedirectView(cleanFrontendUrl + "/pago/fallido?error=server");
        }
    }
}
