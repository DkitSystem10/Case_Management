import { supabase } from './supabase';

export interface AppointmentRecord {
    id: string;
    fullName: string;
    phoneNumber: string;
    emailId: string;
    address: string;
    city: string;
    state: string;
    alreadyCome: 'Yes' | 'No';
    appointmentDate: string;
    timeSlot: string;
    consultationType: 'In-Person' | 'Online' | 'Phone';
    caseCategory: string;
    otherCategory?: string;
    description: string;
    consultationFee: number;
    caseFee: number;
    lawyerId?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}

export interface Lawyer {
    id: string;
    name: string;
    specialization: string;
    experience: string;
    rating: number;
    imageUrl: string;
}

export const getLawyers = async (): Promise<Lawyer[]> => {
    const { data, error } = await supabase
        .from('lawyers')
        .select('*');

    if (error) {
        console.error('Error fetching lawyers:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        specialization: row.specialization,
        experience: row.experience,
        rating: Number(row.rating),
        imageUrl: row.image_url
    }));
};

export const assignLawyer = async (appointmentId: string, lawyerId: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({ lawyer_id: lawyerId })
        .eq('id', appointmentId);

    if (error) {
        console.error('Error assigning lawyer:', error);
        throw error;
    }
};

export const getAppointments = async (): Promise<AppointmentRecord[]> => {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    return (data || []).map(mapToCamelCase);
};

export const saveAppointment = async (appointment: Omit<AppointmentRecord, 'id' | 'status' | 'createdAt'>) => {
    const { data, error } = await supabase
        .from('appointments')
        .insert([mapToSnakeCase(appointment)])
        .select();

    if (error) {
        console.error('Error saving appointment:', error);
        throw error;
    }

    return mapToCamelCase(data[0]);
};

export const updateAppointmentStatus = async (id: string, status: AppointmentRecord['status']) => {
    const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};

export const updateAppointmentFees = async (id: string, consultationFee: number, caseFee: number) => {
    const { error } = await supabase
        .from('appointments')
        .update({
            consultation_fee: consultationFee,
            case_fee: caseFee
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating fees:', error);
        throw error;
    }
};

// Helpers for Mapping
const mapToSnakeCase = (app: any) => ({
    full_name: app.fullName,
    phone_number: app.phoneNumber,
    email_id: app.emailId,
    address: app.address,
    city: app.city,
    state: app.state,
    already_come: app.alreadyCome,
    appointment_date: app.appointmentDate,
    time_slot: app.timeSlot,
    consultation_type: app.consultationType,
    case_category: app.caseCategory,
    other_category: app.otherCategory,
    description: app.description
});

const mapToCamelCase = (row: any): AppointmentRecord => ({
    id: row.id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    emailId: row.email_id,
    address: row.address,
    city: row.city,
    state: row.state,
    alreadyCome: row.already_come,
    appointmentDate: row.appointment_date,
    timeSlot: row.time_slot,
    consultationType: row.consultation_type,
    caseCategory: row.case_category,
    otherCategory: row.other_category,
    description: row.description,
    consultationFee: 0, // Default for UI demo
    caseFee: 0,         // Default for UI demo
    lawyerId: row.lawyer_id,
    status: row.status,
    createdAt: row.created_at
});
