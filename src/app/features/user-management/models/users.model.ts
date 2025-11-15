export interface UserModel {
    id?: number;
    name: string;
    email: string;
    password?: string; // Chỉ dùng khi tạo mới hoặc đổi mật khẩu
    avatar?: string | null;
    avatarUrl?: string | null; // URL đầy đủ cho hiển thị
    verifyEmail?: number;
    role_id?: number;
    role_name?: string;
    status?: string; // Hoạt động, Không hoạt động, Tạm khóa
    created_at?: string;
    updated_at?: string;
    is_deleted?: number;
}

export interface UserFilters {
    id?: number;
    email?: string;
    role_id?: number;
    verifyEmail?: number;
    status?: string;
    search?: string;
}

export interface UserStatistics {
    total_users: number;
    active_users: number;
    verified_users: number;
    unverified_users: number;
    role_distribution: Array<{
        role_name: string;
        count: number;
    }>;
}

export interface RoleModel {
    id: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

