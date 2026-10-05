export type WorkOrderStatus = 
  | 'RECEIVED'
  | 'DIAGNOSIS'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'IN_REPAIR'
  | 'QUALITY_CONTROL'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Vehicle {
  id: string;
  plate: string;
  vin?: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  engine?: string;
  mileage?: number;
  notes?: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  status: WorkOrderStatus;
  entryMileage?: number;
  fuelLevel?: string;
  customerComplaint?: string;
  initialInspection?: string;
  diagnosis?: string;
  internalNotes?: string;
  customerNotes?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  approvedSubtotal?: number;
  approvedTotal?: number;
  approvalMethod?: string;
  approvedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  vehicle: Vehicle;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  assignedUser?: {
    id: string;
    name: string;
  };
}
