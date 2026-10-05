export const formatIntegrationError = (rawMessage: any): string => {
  if (!rawMessage) return 'Ha ocurrido un error inesperado.';

  const msgString = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);

  try {
    // Si el mensaje es puramente string y muy largo/con formato JSON stringified
    // Intentamos extraer el JSON
    const jsonMatch = msgString.match(/\{.*\}/);
    if (jsonMatch) {
      try {
        // Remover posibles escapes como \" si el backend los concatenó
        const unescaped = jsonMatch[0].replace(/\\"/g, '"');
        const parsed = JSON.parse(unescaped);
        
        // Retornar la propiedad más descriptiva que solemos encontrar en pasarelas
        if (parsed.message) {
          const msg = typeof parsed.message === 'string' ? parsed.message : JSON.stringify(parsed.message);
          if (msg.includes('x_login') || msg.includes('x_api_key')) throw new Error('is_qpaypro');
          return msg;
        }
        if (parsed.error_description) return typeof parsed.error_description === 'string' ? parsed.error_description : JSON.stringify(parsed.error_description);
        if (parsed.descripcion) return typeof parsed.descripcion === 'string' ? parsed.descripcion : JSON.stringify(parsed.descripcion);
        if (parsed.error) return typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      } catch (parseError) {
        // Si el parseo estricto falla, seguimos adelante con los fallbacks
      }
    }

    // Fallbacks si no hay JSON válido pero identificamos el proveedor
    const lowerMsg = msgString.toLowerCase();
    if (lowerMsg.includes('recurrente')) {
      return 'La terminal NFC no está lista o hubo un error de conexión. Asegúrate de que el dispositivo esté en Modo Espera e intenta nuevamente.';
    }
    if (lowerMsg.includes('qpaypro') || lowerMsg.includes('x_login') || lowerMsg.includes('x_api_key')) {
      return 'Faltan credenciales de QPayPro (API Secret y Public_Key) o hubo un error con la pasarela. Verifica la configuración de tus integraciones.';
    }

    // Limpiar prefijos HTTP feos (ej: "409 Conflict: ", "500 Internal Server Error: ")
    const cleanedMessage = msgString
      .replace(/^[0-9]{3}\s[A-Za-z\s]+:\s*/, '') // Remueve "409 Conflict: "
      .replace(/^['"]|['"]$/g, ''); // Remueve comillas al inicio y final
      
    return cleanedMessage;
  } catch (e) {
    return msgString;
  }
};
