import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../services/logger.service';
import { sendPaymentReceiptEmail } from '../services/email.service';

export const handleRelay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saleId } = req.params;
    const x_response_status = req.query?.x_response_status || req.body?.x_response_status;

    logger.info(`QPayPro Relay received for sale ${saleId}:`, { query: req.query, body: req.body });

    let sale = await prisma.sale.findUnique({
      where: { id: saleId as string },
      include: {
        customer: true,
        tenant: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (sale) {
      if (x_response_status === '1') {
        if (sale.status === 'PENDING') {
          // Actualizar estado de la venta
          sale = await prisma.sale.update({
            where: { id: sale.id },
            data: { status: 'COMPLETED' },
            include: {
              customer: true,
              tenant: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          });
          logger.info(`Sale ${sale.id} automatically marked as COMPLETED via QPayPro Relay`);
          
          if (sale.customer?.email) {
            try {
              await sendPaymentReceiptEmail({
                toEmail: sale.customer.email,
                customerName: sale.customer.name,
                companyName: sale.tenant.name,
                saleId: sale.id,
                total: sale.total,
                items: sale.items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.price })),
                date: sale.createdAt
              });
              logger.info(`Payment receipt email sent for sale ${sale.id} to ${sale.customer.email}`);
            } catch (emailError) {
              logger.error(`Error sending payment receipt email for sale ${sale.id}:`, emailError);
            }
          }
        }
      } else if (x_response_status) {
        if (sale.status === 'PENDING') {
          sale = await prisma.sale.update({
            where: { id: sale.id },
            data: { status: 'FAILED' }
          });
          logger.info(`Sale ${sale.id} automatically marked as FAILED via QPayPro Relay`);
        }
      }
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

    // Redirigir según el estado actual de la venta (leído de la BD)
    if (sale?.status === 'COMPLETED') {
      res.redirect(`${frontendUrl}/pago/exitoso?saleId=${saleId || ''}`);
    } else if (sale?.status === 'FAILED' || (x_response_status && x_response_status !== '1')) {
      res.redirect(`${frontendUrl}/pago/fallido?saleId=${saleId || ''}`);
    } else {
      // Si sigue PENDING, no hay status
      res.redirect(`${frontendUrl}`);
    }

  } catch (error) {
    logger.error('Error handling QPayPro relay:', error);
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    // Redirigir al frontend incluso si hubo un error en nuestro lado
    res.redirect(`${frontendUrl}/pago/fallido?error=server`);
  }
};
