export interface StudentsModel {
    id?: number;
    student_code: string;
    full_name: string;
    gender: 'Nam' | 'Nữ' | 'Khác';
    date_of_birth?: string | null;  // Ngày sinh - khớp với database hiện tại
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    
    // Các field này sẽ có sau khi chạy migration
    enrollment_date?: string | null;
    
    // Fields for language center only
    avatar_url?: string | null; // URL hình đại diện
    
    status: 'Đang học' | 'Tạm dừng' | 'Hoàn thành' | 'Nghỉ học';
    note?: string | null;
    created_at?: string;
    updated_at?: string;
    is_deleted?: number;
}

export interface StudentFilters {
    id?: number;
    gender?: string;
    status?: string;
    enrollment_date_from?: string;
    enrollment_date_to?: string;
    age_from?: number;
    age_to?: number;
    search?: string;
}

export interface StudentStatistics {
    total_students: number;
    active_students: number;
    inactive_students: number;
    graduated_students: number;
    gender_distribution: Array<{
        gender: string;
        count: number;
    }>;
    language_distribution: Array<{
        language: string;
        count: number;
    }>;
    level_distribution: Array<{
        level: string;
        count: number;
    }>;
    status_distribution: Array<{
        status: string;
        count: number;
    }>;
    average_age: number;
    enrollment_by_month: Array<{
        month: string;
        count: number;
    }>;
}

export interface StudentWithDetails extends StudentsModel {
    // Additional computed fields for display in language center
    age?: number;
    full_address?: string;
    parent_info?: string;
    language_progress?: string; // Tiến độ học ngôn ngữ
    next_level?: string; // Trình độ tiếp theo cần đạt
    study_duration?: string; // Thời gian học tại trung tâm
}
  