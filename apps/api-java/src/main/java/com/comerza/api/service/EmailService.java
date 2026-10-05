package com.comerza.api.service;

import com.comerza.api.entity.Sale;
import com.comerza.api.config.ResendProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private final ResendProperties resendProperties;
    private final RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Autowired
    public EmailService(ResendProperties resendProperties) {
        this.resendProperties = resendProperties;
        this.restTemplate = new RestTemplate();
    }

    // For testing
    protected EmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.resendProperties = null;
    }

    public void sendPaymentReceiptEmail(Sale sale) {
        log.info("Preparing payment receipt email for sale {} to {}", sale.getId(), sale.getCustomer().getEmail());
        String subject = "Recibo de Pago - Comerza";
        String htmlBody = "<p>Hola " + sale.getCustomer().getName() + ",</p><p>Tu pago por un total de <strong>Q" + sale.getTotal() + "</strong> ha sido registrado exitosamente.</p>";
        sendResendEmail(sale.getCustomer().getEmail(), subject, htmlBody);
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        log.info("Preparing password reset email for {}", toEmail);
        String subject = "Recuperación de Contraseña - Comerza";
        String htmlBody = "<p>Hola,</p><p>Has solicitado restablecer tu contraseña en Comerza. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>"
                + "<p><a href=\"" + resetLink + "\">Restablecer mi contraseña</a></p>"
                + "<p>Si no solicitaste este cambio, puedes ignorar este correo.</p>";
        sendResendEmail(toEmail, subject, htmlBody);
    }

    public void sendReservationEmail(com.comerza.api.entity.Reservation reservation, String frontendBaseUrl) {
        log.info("Preparing reservation email for reservation {} to {}", reservation.getId(), reservation.getCustomer().getEmail());
        String subject = "📅 Tu reservación está confirmada - " + reservation.getTenant().getName();

        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", new java.util.Locale("es", "ES"));
        String formattedDate = reservation.getStartTime().format(formatter);

        // Capitalize first letter
        formattedDate = formattedDate.substring(0, 1).toUpperCase() + formattedDate.substring(1);

        String token = reservation.getActionToken();
        String baseUrl = frontendBaseUrl != null ? frontendBaseUrl : "http://localhost:3000";
        String actionBase = baseUrl + "/reserva/" + token;

        String confirmUrl   = actionBase + "?action=confirm";
        String rejectUrl    = actionBase + "?action=reject";
        String rescheduleUrl = actionBase + "?action=reschedule";

        String tenantName = reservation.getTenant().getName();
        String customerName = reservation.getCustomer().getName();
        String motive = reservation.getTitle() != null && !reservation.getTitle().isEmpty() ? reservation.getTitle() : "Cita / Consulta";
        String notes = reservation.getNotes() != null && !reservation.getNotes().isEmpty()
            ? "<tr><td style='padding: 8px 0; color:#6b7280; font-size:14px; border-bottom:1px solid #f3f4f6;'>Notas</td><td style='padding: 8px 0; font-size:14px; text-align:right; font-weight:500;'>" + reservation.getNotes() + "</td></tr>"
            : "";

        String htmlBody = "<!DOCTYPE html>"
            + "<html lang='es'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<style>"
            + "  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');"
            + "  * { margin:0; padding:0; box-sizing:border-box; }"
            + "  body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; background:#f8fafc; color:#1e293b; -webkit-font-smoothing:antialiased; }"
            + "  .wrapper { background:#f8fafc; padding: 40px 16px; }"
            + "  .card { background:#ffffff; border-radius:20px; max-width:560px; margin:0 auto; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }"
            + "  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 40px 32px; text-align:center; }"
            + "  .header-icon { width:64px; height:64px; background:rgba(255,255,255,0.2); border-radius:50%; margin:0 auto 16px; display:flex; align-items:center; justify-content:center; font-size:30px; line-height:64px; }"
            + "  .header h1 { color:#fff; font-size:22px; font-weight:700; letter-spacing:-0.3px; margin-bottom:6px; }"
            + "  .header p { color:rgba(255,255,255,0.8); font-size:14px; }"
            + "  .body { padding: 36px 40px; }"
            + "  .greeting { font-size:18px; font-weight:600; margin-bottom:8px; }"
            + "  .subtitle { color:#6b7280; font-size:14px; margin-bottom:28px; line-height:1.6; }"
            + "  .detail-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:20px 24px; margin-bottom:28px; }"
            + "  .detail-card table { width:100%; border-collapse:collapse; }"
            + "  .detail-card td { padding:10px 0; font-size:14px; vertical-align:top; }"
            + "  .detail-card tr:not(:last-child) td { border-bottom:1px solid #f1f5f9; }"
            + "  .label { color:#94a3b8; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }"
            + "  .value { color:#1e293b; font-weight:600; text-align:right; }"
            + "  .date-highlight { color:#6366f1; font-size:15px; }"
            + "  .actions-title { font-size:13px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px; }"
            + "  .actions { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; }"
            + "  .btn { display:inline-block; padding:12px 20px; border-radius:10px; font-size:14px; font-weight:600; text-decoration:none; text-align:center; cursor:pointer; transition:all 0.2s; }"
            + "  .btn-confirm { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }"
            + "  .btn-reschedule { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; }"
            + "  .btn-reject { background:#fff; color:#ef4444; border:2px solid #fecaca; }"
            + "  .divider { height:1px; background:#f1f5f9; margin:24px 0; }"
            + "  .footer { text-align:center; padding:24px 40px 32px; background:#f8fafc; border-top:1px solid #f1f5f9; }"
            + "  .footer p { color:#94a3b8; font-size:12px; line-height:1.8; }"
            + "  .footer a { color:#6366f1; text-decoration:none; }"
            + "  .badge { display:inline-block; background:#fef3c7; color:#d97706; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; }"
            + "</style></head>"
            + "<body><div class='wrapper'><div class='card'>"

            // Header
            + "<div class='header'>"
            + "  <div class='header-icon'>📅</div>"
            + "  <h1>Reservación Registrada</h1>"
            + "  <p>" + tenantName + "</p>"
            + "</div>"

            // Body
            + "<div class='body'>"
            + "  <p class='greeting'>Hola, " + customerName + " 👋</p>"
            + "  <p class='subtitle'>Tu reservación ha sido registrada exitosamente. Revisa los detalles a continuación y usa los botones para gestionar tu cita.</p>"

            + "  <div class='detail-card'>"
            + "    <table>"
            + "      <tr>"
            + "        <td class='label'>Estado</td>"
            + "        <td class='value'><span class='badge'>Pendiente</span></td>"
            + "      </tr>"
            + "      <tr>"
            + "        <td class='label'>Motivo</td>"
            + "        <td class='value'>" + motive + "</td>"
            + "      </tr>"
            + "      <tr>"
            + "        <td class='label'>Fecha y hora</td>"
            + "        <td class='value date-highlight'>" + formattedDate + "</td>"
            + "      </tr>"
            + notes
            + "    </table>"
            + "  </div>"

            + "  <p class='actions-title'>¿Qué deseas hacer?</p>"
            + "  <table width='100%' cellpadding='0' cellspacing='0'>"
            + "    <tr>"
            + "      <td style='padding:4px;'>"
            + "        <a href='" + confirmUrl + "' class='btn btn-confirm' style='display:block; padding:13px 0; border-radius:10px; background:linear-gradient(135deg,#10b981,#059669); color:#fff; font-size:14px; font-weight:600; text-decoration:none; text-align:center;'>✅ Confirmar cita</a>"
            + "      </td>"
            + "    </tr>"
            + "    <tr>"
            + "      <td style='padding:4px;'>"
            + "        <a href='" + rescheduleUrl + "' class='btn btn-reschedule' style='display:block; padding:13px 0; border-radius:10px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; font-size:14px; font-weight:600; text-decoration:none; text-align:center;'>📆 Solicitar nuevo horario</a>"
            + "      </td>"
            + "    </tr>"
            + "    <tr>"
            + "      <td style='padding:4px;'>"
            + "        <a href='" + rejectUrl + "' class='btn btn-reject' style='display:block; padding:13px 0; border-radius:10px; background:#fff; color:#ef4444; border:2px solid #fecaca; font-size:14px; font-weight:600; text-decoration:none; text-align:center;'>❌ No podré asistir</a>"
            + "      </td>"
            + "    </tr>"
            + "  </table>"

            + "  <div class='divider'></div>"
            + "  <p style='font-size:12px; color:#94a3b8; text-align:center; line-height:1.7;'>Si tienes dudas, contáctanos directamente.<br>Este enlace es único y seguro para tu reservación.</p>"
            + "</div>"

            // Footer
            + "<div class='footer'>"
            + "  <p>Enviado por <strong>" + tenantName + "</strong> a través de <a href='https://comerza.me'>Comerza</a></p>"
            + "  <p style='margin-top:6px;'>© 2026 Comerza · Gestión inteligente para tu negocio</p>"
            + "</div>"
            + "</div></div></body></html>";

        sendResendEmail(reservation.getCustomer().getEmail(), subject, htmlBody);
    }


    public void sendCronExecutionEmail(String toEmail, String subject, String message) {
        log.info("Preparing admin email to {}: {} - {}", toEmail, subject, message);
        sendResendEmail(toEmail, subject, "<p>" + message + "</p>");
    }

    public boolean sendResendEmail(String toEmail, String subject, String htmlBody) {
        String apiKey = resendProperties != null ? resendProperties.apiKey() : null;
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("test_api_key")) {
            log.warn("RESEND_API_KEY is not configured or is a test key. Email simulated to: {}", toEmail);
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("Content-Type", "application/json");

            Map<String, Object> requestBody = Map.of(
                "from", "Comerza <noreply@comerza.me>", // Debe ser un dominio verificado en Resend
                "to", new String[]{toEmail},
                "subject", subject,
                "html", htmlBody
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.resend.com/emails",
                HttpMethod.POST,
                entity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email successfully sent to {} via Resend", toEmail);
                return true;
            } else {
                log.error("Failed to send email to {} via Resend. Status: {}", toEmail, response.getStatusCode());
                return false;
            }
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorResponse = e.getResponseBodyAsString();
            String userMessage = "Error " + e.getStatusCode().value() + " en Resend";
            
            // Intentar extraer el mensaje de Resend si es JSON
            if (errorResponse.contains("\"message\"")) {
                try {
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"message\"\\s*:\\s*\"([^\"]+)\"");
                    java.util.regex.Matcher m = p.matcher(errorResponse);
                    if (m.find()) {
                        userMessage = m.group(1);
                    }
                } catch (Exception parseEx) {
                    // Ignorar error de parseo
                }
            }
            log.error("Resend HTTP Error: {}", errorResponse);
            throw new RuntimeException(userMessage);
        } catch (Exception e) {
            log.error("Exception occurred while sending email to {} via Resend: {}", toEmail, e.getMessage());
            throw new RuntimeException("Error inesperado: " + e.getMessage());
        }
    }
}
