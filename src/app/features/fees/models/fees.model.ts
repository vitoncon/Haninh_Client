export interface Fee {
  id?: number;
  student_id: number;
  class_id: number;
  course_id: number;
  amount: number;
  payment_type: 'Học phí' | 'Phí thi' | 'Phí tài liệu' | 'Phí khác';
  payment_method: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ tín dụng' | 'Ví điện tử';
  payment_status: 'Chưa thanh toán' | 'Đã thanh toán' | 'Quá hạn' | 'Hoàn thành' | 'Đã hủy';
  due_date: string;
  paid_date?: string;
  receipt_number?: string;
  transaction_id?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number;
  deleted_by?: number;
}

export interface FeeWithDetails extends Fee {
  student_name?: string;
  student_code?: string;
  student_phone?: string;
  student_email?: string;
  class_name?: string;
  class_code?: string;
  course_name?: string;
  course_code?: string;
  teacher_name?: string;
}

export interface FeeFilters {
  student_id?: number;
  class_id?: number;
  course_id?: number;
  payment_type?: string;
  payment_method?: string;
  payment_status?: string;
  due_date_from?: string;
  due_date_to?: string;
  paid_date_from?: string;
  paid_date_to?: string;
  amount_from?: number;
  amount_to?: number;
  search?: string;
}

export interface FeeStatistics {
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
  total_students: number;
  paid_students: number;
  unpaid_students: number;
}
