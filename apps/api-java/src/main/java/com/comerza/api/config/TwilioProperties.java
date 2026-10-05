package com.comerza.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "twilio")
public record TwilioProperties(
    String accountSid,
    String authToken,
    String whatsappNumber
) {
}
