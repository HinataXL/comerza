package com.comerza.api.dto;

import lombok.Data;

@Data
public class PublicApprovalRejectRequest {
    private String reason;
    private String comment;
}
