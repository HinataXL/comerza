import { cookies } from 'next/headers';

const getBaseUrl = () => {
  const url = process.env.JAVA_API_BASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JAVA_API_BASE_URL environment variable is missing in production');
    }
    return 'http://localhost:8080';
  }
  return url;
};

export class JavaApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'JavaApiError';
  }
}

const fetchJavaApi = async (path: string, token: string, method: string = 'GET', body?: any) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const options: RequestInit = {
    method: method,
    headers: {
      'Cookie': `comerza_token=${token}`
    },
    cache: 'no-store'
  };

  if (body) {
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    let message = `Failed to fetch ${path}`;
    try {
      const errData = await res.json();
      if (errData.message) message = errData.message;
    } catch (e) {}
    throw new JavaApiError(message, res.status);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const getProducts = async (token: string) => {
  return fetchJavaApi('/api/products', token);
};

export const getCustomers = async (token: string) => {
  return fetchJavaApi('/api/customers', token);
};

export const getReservations = async (token: string) => {
  return fetchJavaApi('/api/reservations', token);
};

export const getCurrentUser = async (token: string) => {
  return fetchJavaApi('/api/auth/me', token);
};

export const updateProfile = async (data: any, token: string) => {
  return fetchJavaApi('/api/auth/profile', token, 'PUT', data);
};

export const getTallerVehicles = async (token: string) => {
  return fetchJavaApi('/api/taller/vehicles', token);
};

export const getTallerVehicleById = async (id: string, token: string) => {
  return fetchJavaApi(`/api/taller/vehicles/${id}`, token);
};

export const getTallerWorkOrders = async (token: string) => {
  return fetchJavaApi('/api/taller/work-orders', token);
};

export const getTallerWorkOrderById = async (id: string, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}`, token);
};

export const generateApprovalLink = async (id: string, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/approval-link`, token, 'POST');
};

export const generateTrackingLink = async (id: string, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/tracking-link`, token, 'POST');
};

// --- FASE 5: TRACEABILITY ---

export const updateReception = async (id: string, data: any, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/reception`, token, 'PUT', data);
};

export const getChecklist = async (id: string, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/checklist`, token);
};

export const updateChecklist = async (id: string, data: any, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/checklist`, token, 'PUT', data);
};

export const updateQualityControl = async (id: string, data: any, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/quality-control`, token, 'PUT', data);
};

export const deliverVehicle = async (id: string, data: any, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/deliver`, token, 'POST', data);
};

export const getPhotos = async (id: string, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/photos`, token);
};

export const uploadPhoto = async (id: string, formData: FormData, token: string) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/taller/work-orders/${id}/photos`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Cookie': `comerza_token=${token}`
    },
    body: formData,
    cache: 'no-store'
  });

  if (!res.ok) {
    let message = `Failed to upload photo`;
    try {
      const errData = await res.json();
      if (errData.message) message = errData.message;
    } catch (e) {}
    throw new JavaApiError(message, res.status);
  }

  return res.json();
};

export const deletePhoto = async (id: string, photoId: string, token: string) => {
  return fetchJavaApi(`/api/taller/work-orders/${id}/photos/${photoId}`, token, 'DELETE');
};

// PUBLIC ENDPOINTS

const fetchPublicApi = async (path: string, method: string = 'GET', body?: any) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;
  const options: RequestInit = {
    method,
    cache: 'no-store',
    headers: {}
  };

  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    let message = `Failed to fetch ${path}`;
    try {
      const errData = await res.json();
      if (errData.message) message = errData.message;
    } catch (e) {}
    throw new JavaApiError(message, res.status);
  }

  // Si no hay contenido (por ejemplo, 200 OK vacío), regresar null
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const getPublicApprovalDetails = async (token: string) => {
  return fetchPublicApi(`/api/public/taller/approval/${token}`);
};

export const approvePublicWorkOrder = async (token: string) => {
  return fetchPublicApi(`/api/public/taller/approval/${token}/approve`, 'POST');
};

export const rejectPublicWorkOrder = async (token: string, reason: string, comment: string) => {
  return fetchPublicApi(`/api/public/taller/approval/${token}/reject`, 'POST', { reason, comment });
};

export const getPublicTrackingDetails = async (token: string) => {
  return fetchPublicApi(`/api/public/taller/tracking/${token}`);
};
