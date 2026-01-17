import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: config.email.user
    ? {
        user: config.email.user,
        pass: config.email.pass,
      }
    : undefined,
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!config.email.host) {
      logger.warn('Email not configured, skipping email send');
      logger.info(`Would send email to ${options.to}: ${options.subject}`);
      return true;
    }

    await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
}

// Email templates
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

  return sendEmail({
    to: email,
    subject: 'Bienvenue - Vérifiez votre email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur le système de réservation</h1>
          </div>
          <div class="content">
            <p>Bonjour ${firstName},</p>
            <p>Merci de vous être inscrit sur notre système de gestion de réservation de véhicules.</p>
            <p>Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Vérifier mon email</a>
            </p>
            <p>Ce lien expire dans 24 heures.</p>
            <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>Togo Data Lab - Système de Gestion de Réservations</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: 'Réinitialisation de mot de passe',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour ${firstName},</p>
            <p>Vous avez demandé une réinitialisation de mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Réinitialiser le mot de passe</a>
            </p>
            <p>Ce lien expire dans 1 heure.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>Togo Data Lab - Système de Gestion de Réservations</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendReservationConfirmationEmail(
  email: string,
  firstName: string,
  reservation: {
    referenceNumber: string;
    vehicleName: string;
    startDate: Date;
    endDate: Date;
    destination: string;
  }
): Promise<boolean> {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return sendEmail({
    to: email,
    subject: `Réservation créée - ${reservation.referenceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réservation Confirmée</h1>
          </div>
          <div class="content">
            <p>Bonjour ${firstName},</p>
            <p>Votre réservation a été créée avec succès.</p>

            <div class="details">
              <h3>Détails de la réservation</h3>
              <div class="details-row">
                <strong>Référence:</strong>
                <span>${reservation.referenceNumber}</span>
              </div>
              <div class="details-row">
                <strong>Véhicule:</strong>
                <span>${reservation.vehicleName}</span>
              </div>
              <div class="details-row">
                <strong>Début:</strong>
                <span>${formatDate(reservation.startDate)}</span>
              </div>
              <div class="details-row">
                <strong>Fin:</strong>
                <span>${formatDate(reservation.endDate)}</span>
              </div>
              <div class="details-row">
                <strong>Destination:</strong>
                <span>${reservation.destination}</span>
              </div>
            </div>

            <p>Votre réservation est en attente d'approbation. Vous recevrez une notification dès qu'elle sera traitée.</p>
          </div>
          <div class="footer">
            <p>Togo Data Lab - Système de Gestion de Réservations</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendReservationStatusEmail(
  email: string,
  firstName: string,
  reservation: {
    referenceNumber: string;
    status: string;
    reason?: string;
  }
): Promise<boolean> {
  const statusColors: Record<string, string> = {
    APPROVED: '#22c55e',
    REJECTED: '#ef4444',
    CANCELLED: '#f59e0b',
    COMPLETED: '#3b82f6',
  };

  const statusLabels: Record<string, string> = {
    APPROVED: 'Approuvée',
    REJECTED: 'Refusée',
    CANCELLED: 'Annulée',
    COMPLETED: 'Terminée',
  };

  const color = statusColors[reservation.status] || '#6b7280';
  const label = statusLabels[reservation.status] || reservation.status;

  return sendEmail({
    to: email,
    subject: `Réservation ${label} - ${reservation.referenceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .status-badge { display: inline-block; padding: 8px 16px; background: ${color}; color: white; border-radius: 20px; font-weight: bold; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Mise à jour de réservation</h1>
          </div>
          <div class="content">
            <p>Bonjour ${firstName},</p>
            <p>Le statut de votre réservation <strong>${reservation.referenceNumber}</strong> a été mis à jour.</p>

            <p style="text-align: center; margin: 30px 0;">
              <span class="status-badge">${label}</span>
            </p>

            ${
              reservation.reason
                ? `<p><strong>Motif:</strong> ${reservation.reason}</p>`
                : ''
            }

            <p>Connectez-vous à votre compte pour plus de détails.</p>
          </div>
          <div class="footer">
            <p>Togo Data Lab - Système de Gestion de Réservations</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendMaintenanceReminderEmail(
  email: string,
  firstName: string,
  vehicle: {
    brand: string;
    model: string;
    registrationNumber: string;
  },
  maintenanceDate: Date
): Promise<boolean> {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return sendEmail({
    to: email,
    subject: `Rappel maintenance - ${vehicle.registrationNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rappel de Maintenance</h1>
          </div>
          <div class="content">
            <p>Bonjour ${firstName},</p>
            <p>Ceci est un rappel que le véhicule suivant a une maintenance prévue :</p>
            <ul>
              <li><strong>Véhicule:</strong> ${vehicle.brand} ${vehicle.model}</li>
              <li><strong>Immatriculation:</strong> ${vehicle.registrationNumber}</li>
              <li><strong>Date prévue:</strong> ${formatDate(maintenanceDate)}</li>
            </ul>
            <p>Veuillez prendre les dispositions nécessaires.</p>
          </div>
          <div class="footer">
            <p>Togo Data Lab - Système de Gestion de Réservations</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
