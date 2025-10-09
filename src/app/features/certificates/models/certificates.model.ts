export interface Certificate {
  id?: number;
  certificate_code: string;
  certificate_name: string;
  description?: string;
  criteria?: string;
  validity_period_months?: number;
  is_permanent: number; // 0 hoặc 1 thay vì boolean
  status: 'Hoạt động' | 'Tạm dừng' | 'Đã hủy';
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number;
  deleted_by?: number;
}

export interface StudentCertificate {
  id?: number;
  student_id: number;
  certificate_id: number;
  class_id?: number;
  issued_date: string;
  expiry_date?: string;
  certificate_number: string;
  status: 'Đã cấp' | 'Đã thu hồi' | 'Đã hết hạn' | 'Đang chờ';
  note?: string;
  issued_by?: string;
  signature?: string;
  certificate_file_path?: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number;
  deleted_by?: number;
}

export interface StudentCertificateWithDetails extends StudentCertificate {
  student_name?: string;
  student_code?: string;
  certificate_name?: string;
  certificate_code?: string;
  class_name?: string;
  class_code?: string;
}

export interface CertificateFilters {
  certificate_id?: number;
  student_id?: number;
  class_id?: number;
  status?: string;
  issued_date_from?: string;
  issued_date_to?: string;
  expiry_date_from?: string;
  expiry_date_to?: string;
  search?: string;
}

export interface CertificateStatistics {
  total_certificates: number;
  issued_certificates: number;
  expired_certificates: number;
  revoked_certificates: number;
  pending_certificates: number;
  total_students: number;
}
