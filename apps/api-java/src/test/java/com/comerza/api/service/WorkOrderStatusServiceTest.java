package com.comerza.api.service;

import com.comerza.api.enums.WorkOrderStatus;
import com.comerza.api.entity.Tenant;
import com.comerza.api.entity.User;
import com.comerza.api.entity.WorkOrder;
import com.comerza.api.repository.WorkOrderRepository;
import com.comerza.api.repository.WorkOrderStatusHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkOrderStatusServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private WorkOrderStatusHistoryRepository historyRepository;

    @InjectMocks
    private WorkOrderStatusService statusService;

    private WorkOrder workOrder;
    private User user;

    @BeforeEach
    void setUp() {
        Tenant tenant = new Tenant();
        tenant.setId("tenant-123");

        user = new User();
        user.setId("user-1");
        user.setTenant(tenant);

        workOrder = new WorkOrder();
        workOrder.setId("wo-1");
        workOrder.setTenant(tenant);
        workOrder.setStatus(WorkOrderStatus.RECEIVED);
    }

    @Test
    void testValidStatusTransition_ReceivedToDiagnosis() {
        when(workOrderRepository.findByIdAndTenantId("wo-1", "tenant-123")).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(any(WorkOrder.class))).thenReturn(workOrder);

        WorkOrder updated = statusService.changeStatus("wo-1", "tenant-123", WorkOrderStatus.DIAGNOSIS, user);

        assertEquals(WorkOrderStatus.DIAGNOSIS, updated.getStatus());
        verify(historyRepository, times(1)).save(any());
    }

    @Test
    void testInvalidStatusTransition_ReceivedToDelivered() {
        when(workOrderRepository.findByIdAndTenantId("wo-1", "tenant-123")).thenReturn(Optional.of(workOrder));

        Exception exception = assertThrows(RuntimeException.class, () -> 
            statusService.changeStatus("wo-1", "tenant-123", WorkOrderStatus.DELIVERED, user)
        );

        assertTrue(exception.getMessage().contains("Invalid status transition"));
        verify(historyRepository, never()).save(any());
    }
}
