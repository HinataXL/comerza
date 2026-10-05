'use server';

import { approvePublicWorkOrder, rejectPublicWorkOrder } from '@/lib/server/java-api';

export async function approveOrderAction(token: string) {
  try {
    await approvePublicWorkOrder(token);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al aprobar' };
  }
}

export async function rejectOrderAction(token: string, reason: string, comment: string) {
  try {
    await rejectPublicWorkOrder(token, reason, comment);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al rechazar' };
  }
}
