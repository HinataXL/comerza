import { Resend } from 'resend';
import { logger } from './logger.service';

// Inicializamos resend. 
// Obtenemos la llave dinámicamente para asegurar que .env haya cargado

interface WelcomeEmailParams {
  toEmail: string;
  adminName: string;
  companyName: string;
  password: string;
}

export const sendWelcomeEmail = async (params: WelcomeEmailParams) => {
  const { toEmail, adminName, companyName, password } = params;
  const resendApiKey = process.env.RESEND_API_KEY || '';
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY no configurada. El email no se enviará.');
    return;
  }

  const resend = new Resend(resendApiKey);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e3a8a; padding: 32px 24px; text-align: center;">
        <img src="https://comerza.me/logo.png" alt="Comerza Logo" style="height: 40px; margin-bottom: 16px;" />
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">¡Bienvenido a Comerza!</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Hola <strong>${adminName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Tu espacio de trabajo para <strong>${companyName}</strong> ha sido creado exitosamente por el administrador de la plataforma.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #0f172a;">Tus credenciales de acceso:</h3>
          <p style="margin: 8px 0;"><strong>Correo:</strong> ${toEmail}</p>
          <p style="margin: 8px 0;"><strong>Contraseña temporal:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${password}</span></p>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">
          Te recomendamos iniciar sesión lo antes posible y cambiar esta contraseña desde los ajustes de tu cuenta por motivos de seguridad.
        </p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://comerza.me/login" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Ingresar al Sistema
          </a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Este es un correo automático, por favor no respondas a esta dirección.</p>
        <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} Comerza POS. Todos los derechos reservados.</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Comerza <hola@comerza.me>', // Usando el dominio oficial
      to: [toEmail],
      subject: `¡Bienvenido a Comerza! Credenciales de acceso para ${companyName}`,
      html: htmlTemplate,
    });
    logger.info('Correo de bienvenida enviado:', data);
    return data;
  } catch (error) {
    logger.error('Error al enviar el correo con Resend:', error);
    throw error;
  }
};

export const sendSuperAdminWelcomeEmail = async (params: { toEmail: string, adminName: string, password: string }) => {
  const { toEmail, adminName, password } = params;
  const resendApiKey = process.env.RESEND_API_KEY || '';
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY no configurada. El email no se enviará.');
    return;
  }

  const resend = new Resend(resendApiKey);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e3a8a; padding: 32px 24px; text-align: center;">
        <img src="https://comerza.me/logo.png" alt="Comerza Logo" style="height: 40px; margin-bottom: 16px;" />
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">¡Bienvenido al Panel Global de Comerza!</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Hola <strong>${adminName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Tu cuenta de <strong>Superadmin</strong> ha sido creada exitosamente. Ahora tienes acceso global a la administración de comercios.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #0f172a;">Tus credenciales de acceso:</h3>
          <p style="margin: 8px 0;"><strong>Correo:</strong> ${toEmail}</p>
          <p style="margin: 8px 0;"><strong>Contraseña temporal:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${password}</span></p>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">
          Por favor inicia sesión lo antes posible y cambia esta contraseña.
        </p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://comerza.me/login" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Ingresar al Sistema
          </a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Este es un correo automático, por favor no respondas a esta dirección.</p>
        <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} Comerza POS. Todos los derechos reservados.</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Comerza <hola@comerza.me>',
      to: [toEmail],
      subject: `¡Bienvenido a Comerza! Credenciales de Superadmin`,
      html: htmlTemplate,
    });
    return data;
  } catch (error) {
    logger.error('Error al enviar el correo con Resend:', error);
    throw error;
  }
};

export const sendSuspensionEmail = async (params: { toEmail: string, companyName: string }) => {
  const { toEmail, companyName } = params;
  const resendApiKey = process.env.RESEND_API_KEY || '';
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY no configurada. El email no se enviará.');
    return;
  }

  const resend = new Resend(resendApiKey);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ef4444; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Aviso Importante: Suspensión de Servicio</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Estimado cliente de <strong>${companyName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Lamentamos informarte que tu espacio de trabajo en Comerza ha sido <strong>suspendido</strong>.</p>
        
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #fca5a5;">
          <h3 style="margin-top: 0; color: #991b1b;">Motivo de suspensión: Falta de pago</h3>
          <p style="margin: 8px 0; color: #7f1d1d;">Tu sistema POS, inventario y facturación se encuentran temporalmente inhabilitados. Para reactivar tus servicios, es necesario regularizar tu situación de pago.</p>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">
          Por favor, contáctanos a la brevedad respondiendo a este correo para procesar tu pago y reactivar tu cuenta inmediatamente.
        </p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="mailto:billing@comerza.me" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Contactar a Facturación
          </a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Comerza POS. Todos los derechos reservados.</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Comerza Billing <billing@comerza.me>',
      to: [toEmail],
      subject: `Aviso Importante: Suspensión de servicio para ${companyName}`,
      html: htmlTemplate,
    });
    return data;
  } catch (error) {
    logger.error('Error al enviar el correo de suspensión:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (params: { toEmail: string, newPassword: string }) => {
  const { toEmail, newPassword } = params;
  const resendApiKey = process.env.RESEND_API_KEY || '';
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY no configurada. El email no se enviará.');
    return;
  }

  const resend = new Resend(resendApiKey);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Recuperación de Contraseña</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Hola,</p>
        <p style="font-size: 16px; line-height: 1.5;">Has solicitado restablecer tu contraseña en Comerza.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #0f172a;">Tus nuevas credenciales:</h3>
          <p style="margin: 8px 0;"><strong>Correo:</strong> ${toEmail}</p>
          <p style="margin: 8px 0;"><strong>Contraseña temporal:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${newPassword}</span></p>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">
          Te recomendamos iniciar sesión y cambiar esta contraseña desde los ajustes de tu cuenta por motivos de seguridad.
        </p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://comerza.me/login" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Ingresar al Sistema
          </a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Este es un correo automático, por favor no respondas a esta dirección.</p>
        <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} Comerza POS. Todos los derechos reservados.</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Comerza <hola@comerza.me>',
      to: [toEmail],
      subject: 'Restablecimiento de contraseña - Comerza',
      html: htmlTemplate,
    });
    return data;
  } catch (error) {
    logger.error('Error al enviar el correo de recuperación:', error);
    throw error;
  }
};

export const sendReservationEmail = async (params: { 
  toEmail: string, 
  customerName: string, 
  companyName: string, 
  date: Date, 
  title: string | null, 
  token: string 
}) => {
  const { toEmail, customerName, companyName, date, title, token } = params;
  const resendApiKey = process.env.RESEND_API_KEY || '';
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY no configurada. El email de reservación no se enviará.');
    return;
  }

  const resend = new Resend(resendApiKey);
  
  const frontendUrl = (process.env.FRONTEND_URL || 'https://comerza.me').replace(/\/$/, '');
  const confirmUrl = `${frontendUrl}/reserva/confirmar?token=${token}&action=CONFIRMED`;
  const cancelUrl = `${frontendUrl}/reserva/confirmar?token=${token}&action=CANCELLED`;

  const dateStr = date.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' });

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nueva Reservación en ${companyName}</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Hola <strong>${customerName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Se ha creado una nueva reservación a tu nombre.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #0f172a;">Detalles de la Cita:</h3>
          <p style="margin: 8px 0;"><strong>Fecha y Hora:</strong> ${dateStr}</p>
          <p style="margin: 8px 0;"><strong>Motivo:</strong> ${title || 'Sin especificar'}</p>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">
          Por favor, confirma tu asistencia o cancela la reservación haciendo clic en uno de los siguientes botones:
        </p>
        
        <div style="display: flex; gap: 16px; justify-content: center; margin-top: 32px;">
          <a href="${confirmUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
            Confirmar Asistencia
          </a>
          <a href="${cancelUrl}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
            Cancelar Cita
          </a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Este es un correo automático. Si necesitas ayuda, por favor contacta al comercio directamente.</p>
        <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} Comerza POS.</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Comerza Reservaciones <reservaciones@comerza.me>',
      to: [toEmail],
      subject: `Confirmación de Reservación - ${companyName}`,
      html: htmlTemplate,
    });
    return data;
  } catch (error) {
    logger.error('Error al enviar el correo de reservación:', error);
    throw error;
  }
};

export const sendCronExecutionEmail = async (params: { 
  toEmail: string, 
  subject: string,
  message: string,
  deletedCount: number
}) => {
  const { toEmail, subject, message, deletedCount } = params;
  const resendApiKey = process.env.RESEND_API_KEY || '';
  
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY no configurada. El email de cron no se enviará.');
    return;
  }

  const resend = new Resend(resendApiKey);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Reporte de Sistema: Tarea Programada</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Hola,</p>
        <p style="font-size: 16px; line-height: 1.5;">El <strong>Cron Job</strong> se ha ejecutado satisfactoriamente.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #0f172a;">Detalles de la ejecución:</h3>
          <p style="margin: 8px 0;"><strong>Mensaje:</strong> ${message}</p>
          <p style="margin: 8px 0;"><strong>Registros eliminados:</strong> <span style="color: #ef4444; font-weight: bold;">${deletedCount}</span></p>
          <p style="margin: 8px 0;"><strong>Fecha de ejecución:</strong> ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Reporte automático del Sistema Comerza SaaS.</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Comerza Dev <desarrollo@comerza.me>',
      to: [toEmail],
      subject: subject,
      html: htmlTemplate,
    });
    return data;
  } catch (error) {
    logger.error('Error al enviar el correo de cron:', error);
  }
};

export const sendPaymentReceiptEmail = async (params: { 
  toEmail: string, 
  customerName: string, 
  companyName: string, 
  saleId: string,
  total: number,
  items: { name: string, quantity: number, price: number }[],
  date: Date
}) => {
  const { toEmail, customerName, companyName, saleId, total, items, date } = params;
  const resendApiKey = process.env.RESEND_API_KEY || '';
  
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY no configurada. El recibo no se enviará.');
    return;
  }

  const resend = new Resend(resendApiKey);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #10b981; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Recibo de Pago Exitoso</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #334155;">
        <p style="font-size: 16px;">Hola <strong>${customerName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Hemos procesado tu pago correctamente para <strong>${companyName}</strong>.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #0f172a;">Detalles de la Compra:</h3>
          <p style="margin: 8px 0;"><strong>ID de Venta:</strong> ${saleId}</p>
          <p style="margin: 8px 0;"><strong>Fecha:</strong> ${date.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p>
          
          <table style="width: 100%; margin-top: 16px; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 8px 0;">Producto</th>
                <th style="text-align: center; padding: 8px 0;">Cant.</th>
                <th style="text-align: right; padding: 8px 0;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0;">${item.name}</td>
                  <td style="text-align: center; padding: 8px 0;">${item.quantity}</td>
                  <td style="text-align: right; padding: 8px 0;">Q${item.price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 16px; text-align: right; font-size: 18px;">
            <strong>Total pagado: Q${total.toFixed(2)}</strong>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">
          Gracias por tu compra. Si tienes alguna duda sobre este cargo, por favor contacta al comercio.
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Comerza POS. Todos los derechos reservados.</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Comerza Billing <billing@comerza.me>',
      to: [toEmail],
      subject: `Recibo de pago - ${companyName}`,
      html: htmlTemplate,
    });
    return data;
  } catch (error) {
    logger.error('Error al enviar el recibo de pago:', error);
  }
};
