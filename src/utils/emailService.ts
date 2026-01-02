import emailjs from '@emailjs/browser';

/**
 * Email Service for LexConnect
 * Handles automated email notifications using EmailJS.
 */

interface EmailTemplateParams {
    toEmail: string;
    fullName: string;
    appointmentDate: string;
    timeSlot: string;
    consultationType: string;
}

export const sendApprovalEmail = async (params: EmailTemplateParams) => {
    const { toEmail, fullName, appointmentDate, timeSlot, consultationType } = params;

    // Get credentials from environment variables
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.error('[Email Service] EmailJS credentials missing in .env');
        return false;
    }

    const templateParams = {
        email: toEmail,           // Changing 'to_email' to 'email'
        name: fullName,           // Changing 'client_name' to 'name'
        date: appointmentDate,    // Changing 'appointment_date' to 'date'
        time: timeSlot,           // Changing 'time_slot' to 'time'
        type: consultationType,   // Changing 'consultation_type' to 'type'
        reply_to: 'dkit.system10@gmail.com'
    };

    try {
        const response = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );

        if (response.status === 200) {
            console.log('[Email Service] Email sent successfully via EmailJS!');
            return true;
        }
        return false;
    } catch (error) {
        console.error('[Email Service] Failed to send email:', error);
        throw error;
    }
};
