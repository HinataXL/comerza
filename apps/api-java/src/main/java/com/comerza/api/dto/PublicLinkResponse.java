package com.comerza.api.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class PublicLinkResponse {
    private String url;
    private LocalDateTime expiresAt;
}
