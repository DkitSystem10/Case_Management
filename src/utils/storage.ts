import { supabase } from './supabase';

export interface AppointmentRecord {
    id: string;
    fullName: string;
    phoneNumber: string;
    emailId: string;
    address: string;
    city: string; // District
    cityName?: string; // City (optional)
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
    caseId?: string;
    caseStage?: string;
    paymentMode?: string;
    transactionId?: string;
    paymentDate?: string;
    documentUrl?: string;
    rejectionReason?: string;
    courtHearingDate?: string;
    currentHearingReport?: string;
    nextHearingDate?: string;
    hearingUpdatedBy?: string;
    hearingUpdatedAt?: string;
    // New comprehensive fields
    clientId?: string;
    clientType?: 'Individual' | 'Company';
    caseTitle?: string;
    caseType?: string;
    courtName?: string;
    caseStatus?: 'Open' | 'Pending' | 'Closed' | 'Appeal';
    branchName?: string;
    branchLocation?: string;
    assignedAdvocate?: string;
    filingDate?: string;
    lastHearingDate?: string;
    stageOfCase?: 'Evidence' | 'Argument' | 'Judgment';
    feeType?: 'Fixed' | 'Stage-wise';
    totalFee?: number;
    paidAmount?: number;
    balanceAmount?: number;
    paymentStatus?: string;
    documentsStatus?: 'Uploaded' | 'Pending';
    importantNotes?: string;
    casePriority?: 'High' | 'Medium' | 'Low';
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
    email?: string;
    password?: string;
    phoneNumber?: string;
    district?: string;
}

export interface PaymentRecord {
    id: string;
    appointmentId: string;
    caseId: string;
    clientName: string;
    consultationFee: number;
    dueFee: number;
    amount: number;
    paymentMode: string;
    transactionId: string;
    paymentDate: string;
}

export const getLawyers = async (): Promise<Lawyer[]> => {
    const { data, error } = await supabase
        .from('lawyers')
        .select('*');

    if (error) {
        console.error('Error fetching lawyers:', error);
        return [];
    }

    const lawyers = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        specialization: row.specialization,
        experience: row.experience,
        rating: Number(row.rating),
        imageUrl: row.image_url || '',
        email: row.email || undefined,
        password: row.password || undefined,
        phoneNumber: row.phone_number || undefined,
        district: row.district || undefined
    }));

    // Deduplicate by name to handle cases where the setup SQL was run multiple times
    return lawyers.filter((lawyer, index, self) =>
        index === self.findIndex((t) => t.name === lawyer.name)
    );
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
        .insert([{ ...mapToSnakeCase(appointment), status: 'Pending' }])
        .select();

    if (error) {
        console.error('Error saving appointment:', error);
        throw error;
    }

    return mapToCamelCase(data[0]);
};

export const uploadDocument = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}-${Math.floor(Date.now() / 1000)}.${fileExt}`;
    const filePath = `appointment-docs/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

    return publicUrl;
};

export const updateAppointmentStatus = async (id: string, status: AppointmentRecord['status'], rejectionReason?: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({
            status,
            rejection_reason: rejectionReason
        })
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

export const updateAppointmentPayment = async (id: string, consultationFee: number, caseFee: number, paymentMode: string, transactionId: string, clientName: string, caseId: string) => {
    // 1. Update appointment fees
    const { error: appError } = await supabase
        .from('appointments')
        .update({
            consultation_fee: consultationFee,
            case_fee: caseFee
        })
        .eq('id', id);

    if (appError) {
        console.error('App Update Error:', appError);
        throw appError;
    }

    // 2. Insert into payments table
    const { error: payError } = await supabase
        .from('payments')
        .insert([{
            appointment_id: id,
            case_id: caseId,
            client_name: clientName,
            consultation_fee: consultationFee,
            due_fee: caseFee,
            amount: consultationFee + caseFee,
            payment_mode: paymentMode,
            transaction_id: transactionId
        }]);

    if (payError) {
        console.error('Payment Insert Error:', payError);
        throw payError;
    }
};

export const getPaymentHistory = async (): Promise<PaymentRecord[]> => {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        appointmentId: row.appointment_id,
        caseId: row.case_id,
        clientName: row.client_name,
        consultationFee: Number(row.consultation_fee || 0),
        dueFee: Number(row.due_fee || 0),
        amount: Number(row.amount),
        paymentMode: row.payment_mode,
        transactionId: row.transaction_id,
        paymentDate: row.payment_date
    }));
};

export const updateCaseId = async (id: string, caseId: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({ case_id: caseId })
        .eq('id', id);

    if (error) {
        console.error('Error updating case ID:', error);
        throw error;
    }
};

export const updateCaseStage = async (id: string, stage: string) => {
    const { error } = await supabase
        .from('appointments')
        .update({ case_stage: stage })
        .eq('id', id);

    if (error) {
        console.error('Error updating case stage:', error);
        throw error;
    }
};

export const updateHearingDetails = async (
    id: string, 
    courtHearingDate: string, 
    currentHearingReport: string, 
    nextHearingDate: string,
    lawyerId?: string
) => {
    // Convert empty strings to null
    const updateData: any = {};
    
    if (courtHearingDate && courtHearingDate.trim() !== '') {
        updateData.court_hearing_date = courtHearingDate;
    } else {
        updateData.court_hearing_date = null;
    }
    
    if (currentHearingReport && currentHearingReport.trim() !== '') {
        updateData.current_hearing_report = currentHearingReport;
    } else {
        updateData.current_hearing_report = null;
    }
    
    if (nextHearingDate && nextHearingDate.trim() !== '') {
        updateData.next_hearing_date = nextHearingDate;
    } else {
        updateData.next_hearing_date = null;
    }

    // Track which lawyer updated (if provided)
    if (lawyerId) {
        updateData.hearing_updated_by = lawyerId;
        updateData.hearing_updated_at = new Date().toISOString();
    }

    const { error, data } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating hearing details:', error);
        // Check if columns don't exist
        if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
            throw new Error('Database columns not found. Please run the SQL migration: add_hearing_columns.sql');
        }
        throw new Error(error.message || 'Failed to update hearing details');
    }

    return data;
};

// Helpers for Mapping
const mapToSnakeCase = (app: any) => ({
    full_name: app.fullName,
    phone_number: app.phoneNumber,
    email_id: app.emailId,
    address: app.address,
    city: app.city,
    city_name: app.cityName || null,
    state: app.state,
    already_come: app.alreadyCome || 'No',
    appointment_date: app.appointmentDate || new Date().toISOString().split('T')[0],
    time_slot: app.timeSlot || '10:00 AM',
    consultation_type: app.consultationType || 'In-Person',
    case_category: app.caseCategory || app.caseType || 'Civil',
    other_category: app.otherCategory,
    description: app.description || app.importantNotes || '',
    case_id: app.caseId,
    case_stage: app.caseStage,
    payment_mode: app.paymentMode,
    transaction_id: app.transactionId,
    payment_date: app.paymentDate,
    document_url: app.documentUrl,
    rejection_reason: app.rejectionReason,
    consultation_fee: app.consultationFee || app.paidAmount || 0,
    case_fee: app.caseFee || app.totalFee || 0,
    // New comprehensive fields
    client_id: app.clientId || null,
    client_type: app.clientType || null,
    case_title: app.caseTitle || null,
    case_type: app.caseType || null,
    court_name: app.courtName || null,
    case_status: app.caseStatus || null,
    branch_name: app.branchName || null,
    branch_location: app.branchLocation || null,
    assigned_advocate: app.assignedAdvocate || app.lawyerId || null,
    filing_date: app.filingDate || null,
    last_hearing_date: app.lastHearingDate || null,
    stage_of_case: app.stageOfCase || null,
    fee_type: app.feeType || null,
    total_fee: app.totalFee ? parseFloat(app.totalFee.toString()) : null,
    paid_amount: app.paidAmount ? parseFloat(app.paidAmount.toString()) : null,
    balance_amount: app.balanceAmount ? parseFloat(app.balanceAmount.toString()) : null,
    payment_status: app.paymentStatus || null,
    documents_status: app.documentsStatus || null,
    important_notes: app.importantNotes || null,
    case_priority: app.casePriority || null
});

const mapToCamelCase = (row: any): AppointmentRecord => ({
    id: row.id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    emailId: row.email_id,
    address: row.address,
    city: row.city,
    cityName: row.city_name || undefined,
    state: row.state,
    alreadyCome: row.already_come,
    appointmentDate: row.appointment_date,
    timeSlot: row.time_slot,
    consultationType: row.consultation_type,
    caseCategory: row.case_category,
    otherCategory: row.other_category,
    description: row.description,
    consultationFee: row.consultation_fee || 0,
    caseFee: row.case_fee || 0,
    lawyerId: row.lawyer_id,
    caseId: row.case_id,
    caseStage: row.case_stage || 'Stage 1',
    paymentMode: row.payment_mode,
    transactionId: row.transaction_id,
    paymentDate: row.payment_date,
    documentUrl: row.document_url,
    rejectionReason: row.rejection_reason,
    courtHearingDate: row.court_hearing_date,
    currentHearingReport: row.current_hearing_report,
    nextHearingDate: row.next_hearing_date,
    hearingUpdatedBy: row.hearing_updated_by,
    hearingUpdatedAt: row.hearing_updated_at,
    // New comprehensive fields
    clientId: row.client_id,
    clientType: row.client_type,
    caseTitle: row.case_title,
    caseType: row.case_type,
    courtName: row.court_name,
    caseStatus: row.case_status,
    branchName: row.branch_name,
    branchLocation: row.branch_location,
    assignedAdvocate: row.assigned_advocate,
    filingDate: row.filing_date,
    lastHearingDate: row.last_hearing_date,
    stageOfCase: row.stage_of_case,
    feeType: row.fee_type,
    totalFee: row.total_fee ? parseFloat(row.total_fee) : undefined,
    paidAmount: row.paid_amount ? parseFloat(row.paid_amount) : undefined,
    balanceAmount: row.balance_amount ? parseFloat(row.balance_amount) : undefined,
    paymentStatus: row.payment_status,
    documentsStatus: row.documents_status,
    importantNotes: row.important_notes,
    casePriority: row.case_priority,
    status: row.status,
    createdAt: row.created_at
});
