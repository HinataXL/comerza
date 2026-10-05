package com.comerza.api.dto;

import lombok.Data;
import com.comerza.api.enums.FuelLevel;

@Data
public class WorkOrderRequest {
    private String customerId;
    private String vehicleId;
    private Integer entryMileage;
    private FuelLevel fuelLevel;
    private String customerComplaint;
    private String initialInspection;
}
