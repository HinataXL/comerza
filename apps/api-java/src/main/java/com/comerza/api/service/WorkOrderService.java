package com.comerza.api.service;

import com.comerza.api.dto.WorkOrderRequest;
import com.comerza.api.entity.Customer;
import com.comerza.api.entity.Tenant;
import com.comerza.api.entity.User;
import com.comerza.api.entity.Vehicle;
import com.comerza.api.entity.WorkOrder;
import com.comerza.api.repository.CustomerRepository;
import com.comerza.api.repository.TenantRepository;
import com.comerza.api.repository.VehicleRepository;
import com.comerza.api.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.comerza.api.entity.Sale;
import com.comerza.api.entity.SaleItem;
import com.comerza.api.entity.WorkOrderItem;
import com.comerza.api.enums.WorkOrderItemType;
import com.comerza.api.entity.Product;
import com.comerza.api.repository.ProductRepository;
import com.comerza.api.repository.SaleRepository;
import com.comerza.api.repository.SaleItemRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final TenantRepository tenantRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;

    public List<WorkOrder> getWorkOrdersByTenant(String tenantId) {
        return workOrderRepository.findByTenantId(tenantId);
    }

    public WorkOrder getWorkOrderByIdAndTenant(String id, String tenantId) {
        return workOrderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("WorkOrder not found"));
    }

    @Transactional
    public WorkOrder createWorkOrder(String tenantId, User user, WorkOrderRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Customer customer = customerRepository.findByIdAndTenantId(request.getCustomerId(), tenantId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Vehicle vehicle = vehicleRepository.findByIdAndTenantId(request.getVehicleId(), tenantId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Generate a simple number for the MVP. In a real system, use a sequence or dedicated table.
        String number = "OT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        WorkOrder workOrder = WorkOrder.builder()
                .tenant(tenant)
                .customer(customer)
                .vehicle(vehicle)
                .assignedUser(user) // Or someone else
                .workOrderNumber(number)
                .entryMileage(request.getEntryMileage())
                .fuelLevel(request.getFuelLevel())
                .customerComplaint(request.getCustomerComplaint())
                .initialInspection(request.getInitialInspection())
                .build();

        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public Sale createSaleFromWorkOrder(String workOrderId, String tenantId, User user) {
        WorkOrder workOrder = workOrderRepository.findByIdAndTenantId(workOrderId, tenantId)
                .orElseThrow(() -> new RuntimeException("WorkOrder not found"));

        if (workOrder.getSale() != null) {
            return workOrder.getSale(); // Idempotent: return existing sale
        }

        Sale sale = new Sale();
        sale.setTenant(workOrder.getTenant());
        sale.setUser(user);
        sale.setCustomer(workOrder.getCustomer());
        sale.setPaymentMethod("Efectivo"); // Default
        sale.setStatus("COMPLETED");
        sale.setTotal(0.0);
        sale = saleRepository.save(sale);

        double total = 0.0;
        List<SaleItem> saleItems = new java.util.ArrayList<>();

        for (WorkOrderItem woItem : workOrder.getItems()) {
            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setTenant(workOrder.getTenant());
            saleItem.setQuantity(woItem.getQuantity().intValue());
            
            // Discount inventory if it's a PART
            if (woItem.getItemType() == WorkOrderItemType.PART && woItem.getProduct() != null) {
                Product product = woItem.getProduct();
                if (product.getStock() < woItem.getQuantity().intValue()) {
                    throw new RuntimeException("Stock insuficiente para el producto: " + product.getName());
                }
                product.setStock(product.getStock() - woItem.getQuantity().intValue());
                productRepository.save(product);
                
                saleItem.setProduct(product);
                saleItem.setPrice(woItem.getUnitPrice());
            } else {
                saleItem.setDescription(woItem.getDescription() != null ? woItem.getDescription() : "Servicio Taller");
                saleItem.setPrice(woItem.getUnitPrice());
            }

            saleItems.add(saleItem);
            total += woItem.getSubtotal(); // Calculate total including services/labor
        }

        saleItemRepository.saveAll(saleItems);
        
        // Finalize total with WorkOrder discounts/taxes
        sale.setTotal(workOrder.getTotal() > 0 ? workOrder.getTotal() : total);
        sale = saleRepository.save(sale);

        // Link Sale to WorkOrder
        workOrder.setSale(sale);
        workOrderRepository.save(workOrder);

        return sale;
    }
}
