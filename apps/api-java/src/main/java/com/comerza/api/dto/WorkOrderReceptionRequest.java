package com.comerza.api.dto;

import com.comerza.api.enums.FuelLevel;
import lombok.Data;

@Data
public class WorkOrderReceptionRequest {
    private Integer entryMileage;
    private FuelLevel fuelLevel;
    private String customerComplaint;
    private String initialInspection;
}
