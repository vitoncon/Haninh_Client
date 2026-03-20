export interface Lead {
    id: number;
    fullname: string;
    phone: string;
    email?: string;
    course_id?: number;
    course_name?: string;
    message?: string;
    status: 'new' | 'contacted' | 'converted' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface LeadStatistics {
    total: number;
    new: number;
    contacted: number;
    converted: number;
    rejected: number;
}
