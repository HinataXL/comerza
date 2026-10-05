export const normalizePhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  
  // Quitar todos los caracteres que no sean dígitos
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  
  // Si ya tiene el código de área 502 al inicio
  if (digits.startsWith('502') && digits.length === 11) {
    return digits;
  }
  
  // Si tiene exactamente 8 dígitos, asumimos que es número local de Guatemala
  if (digits.length === 8) {
    return `502${digits}`;
  }
  
  // Si no cuadra (código internacional diferente u otro formato), 
  // se devuelve los dígitos, aunque WhatsApp podría requerir el formato completo.
  return digits;
};

export const createWhatsAppLink = (phone: string, text: string): string => {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return '';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
};
