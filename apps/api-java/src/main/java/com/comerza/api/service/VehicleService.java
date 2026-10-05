package com.comerza.api.service;

import com.comerza.api.dto.VehicleRequest;
import com.comerza.api.entity.Customer;
import com.comerza.api.entity.Tenant;
import com.comerza.api.entity.Vehicle;
import com.comerza.api.repository.CustomerRepository;
import com.comerza.api.repository.TenantRepository;
import com.comerza.api.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final TenantRepository tenantRepository;

    public List<Vehicle> getVehiclesByTenant(String tenantId) {
        return vehicleRepository.findByTenantId(tenantId);
    }

    public Vehicle getVehicleByIdAndTenant(String id, String tenantId) {
        return vehicleRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }

    @Transactional
    public Vehicle createVehicle(String tenantId, VehicleRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Customer customer = customerRepository.findByIdAndTenantId(request.getCustomerId(), tenantId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (vehicleRepository.existsByPlateAndTenantId(request.getPlate(), tenantId)) {
            throw new RuntimeException("Vehicle with this plate already exists");
        }

        Vehicle vehicle = Vehicle.builder()
                .tenant(tenant)
                .customer(customer)
                .plate(request.getPlate())
                .vin(request.getVin())
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .color(request.getColor())
                .engine(request.getEngine())
                .mileage(request.getMileage())
                .notes(request.getNotes())
                .build();

        return vehicleRepository.save(vehicle);
    }
}
