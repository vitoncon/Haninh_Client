export interface StudyResult {
  id?: number;
  student_id: number;
  class_id: number;
  exam_type: 'Kiểm tra định kỳ' | 'Kiểm tra giữa kỳ' | 'Kiểm tra cuối kỳ' | 'Kiểm tra tổng hợp';
  exam_name: string;
  exam_date: string;
  language: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung';
  skill_type: 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp';
  score: number;
  max_score: number;
  percentage: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  teacher_comment?: string;
  student_feedback?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudyResultWithDetails extends StudyResult {
  student: {
    student_code: string;
    full_name: string;
    email?: string;
  };
  class: {
    class_name: string;
    class_code: string;
    course_name?: string;
  };
  teacher?: {
    id?: number;
    full_name: string;
    teacher_code?: string;
  };
}

export interface StudentStudySummary {
  student_id: number;
  student_code: string;
  full_name: string;
  class_id: number;
  class_name: string;
  class_code: string;
  course_name?: string;
  total_exams: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  level_distribution: {
    A1: number;
    A2: number;
    B1: number;
    B2: number;
    C1: number;
    C2: number;
  };
  recent_results: StudyResult[];
  proficiency_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  overall_rating: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Cần cải thiện';
}

export interface ClassStudyStatistics {
  class_id: number;
  class_name: string;
  class_code: string;
  total_students: number;
  total_exams: number;
  average_score: number;
  pass_rate: number;
  level_distribution: {
    A1: number;
    A2: number;
    B1: number;
    B2: number;
    C1: number;
    C2: number;
  };
  top_performers: {
    student_code: string;
    full_name: string;
    average_score: number;
  }[];
  needs_improvement: {
    student_code: string;
    full_name: string;
    average_score: number;
  }[];
}

export interface StudyResultFilters {
  student_id?: number;
  class_id?: number;
  teacher_id?: number;
  exam_type?: string;
  language?: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung';
  skill_type?: 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp';
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface StudyResultStats {
  total_results: number;
  average_score: number;
  pass_rate: number;
  level_distribution: {
    A1: number;
    A2: number;
    B1: number;
    B2: number;
    C1: number;
    C2: number;
  };
  language_distribution: {
    'Tiếng Anh': number;
    'Tiếng Hàn': number;
    'Tiếng Trung': number;
  };
  skill_type_distribution: {
    'Nghe': number;
    'Nói': number;
    'Đọc': number;
    'Viết': number;
    'Tổng hợp': number;
  };
  exam_type_distribution: {
    [key: string]: number;
  };
}

export interface ClassExamSummary {
  id: number;
  exam_name: string;
  exam_type: 'Kiểm tra định kỳ' | 'Kiểm tra giữa kỳ' | 'Kiểm tra cuối kỳ' | 'Kiểm tra tổng hợp';
  skill_type: 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp';
  exam_date: string;
  language: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung';
  class_id: number;
  total_students: number;
  total_submitted: number;
  average_score: number;
  pass_rate: number;
  created_at?: string;
  updated_at?: string;
}
