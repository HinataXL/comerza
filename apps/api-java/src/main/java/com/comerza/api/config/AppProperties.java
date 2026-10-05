package com.comerza.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
    String frontendUrl,
    String apiUrl
) {
}
