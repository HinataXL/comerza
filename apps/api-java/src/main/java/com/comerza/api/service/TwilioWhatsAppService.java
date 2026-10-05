package com.comerza.api.service;

import com.comerza.api.config.TwilioProperties;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Slf4j
@Service
public class TwilioWhatsAppService {

    private final TwilioProperties twilioProperties;

    public TwilioWhatsAppService(TwilioProperties twilioProperties) {
        this.twilioProperties = twilioProperties;
    }

    @PostConstruct
    public void init() {
        String accountSid = twilioProperties.accountSid();
        String authToken = twilioProperties.authToken();

        if (accountSid != null && !accountSid.trim().isEmpty() 
            && authToken != null && !authToken.trim().isEmpty()) {
            try {
                Twilio.init(accountSid, authToken);
                log.info("Twilio SDK successfully initialized.");
            } catch (Exception e) {
                log.error("Error initializing Twilio SDK: {}", e.getMessage());
            }
        } else {
            log.warn("Twilio configuration is missing. WhatsApp messages will be simulated.");
        }
    }

    public boolean sendWhatsAppMessage(String toPhone, String messageBody) {
        if (twilioProperties.accountSid() == null || twilioProperties.accountSid().trim().isEmpty()) {
            log.warn("Twilio is not configured. Simulating WhatsApp to: {}", toPhone);
            return false;
        }

        try {
            String twilioPhone = twilioProperties.whatsappNumber();
            String from = twilioPhone.startsWith("whatsapp:") ? twilioPhone : "whatsapp:" + twilioPhone;
            String to = toPhone.startsWith("whatsapp:") ? toPhone : "whatsapp:" + toPhone;

            Message message = Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(from),
                    messageBody
            ).create();

            log.info("WhatsApp message successfully sent via Twilio. SID: {}", message.getSid());
            return true;
        } catch (Exception e) {
            log.error("Failed to send WhatsApp message via Twilio to {}: {}", toPhone, e.getMessage());
            return false;
        }
    }
}
