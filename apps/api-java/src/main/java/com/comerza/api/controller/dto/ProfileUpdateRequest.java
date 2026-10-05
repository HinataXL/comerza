package com.comerza.api.controller.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String email;
    private String password;
}
