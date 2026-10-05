package com.comerza.api.dto;

import lombok.Data;

@Data
public class VehicleRequest {
    private String customerId;
    private String plate;
    private String vin;
    private String brand;
    private String model;
    private Integer year;
    private String color;
    private String engine;
    private Integer mileage;
    private String notes;
}
