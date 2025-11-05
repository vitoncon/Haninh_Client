// New interfaces for normalized database structure

export interface Exam {
  id?: number;
  class_id: number;
  exam_name: string;
  exam_type: 'Kiểm tra định kỳ' | 'Kiểm tra giữa kỳ' | 'Kiểm tra cuối kỳ' | 'Kiểm tra trình độ' | 'Thi thử chứng chỉ';
  exam_date: string;
  language: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung';
  description?: string;
  total_max_score: number;
  average_score?: number;
  total_students: number;
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number;
  deleted_by?: number;
}

export interface ExamSkill {
  id?: number;
  exam_id: number;
  skill_type: 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp';
  max_score: number;
  weight: number;
  description?: string;
  order_index: number;
  average_score?: number;
  total_students: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number;
  deleted_by?: number;
}

export interface ExamResult {
  id?: number;
  exam_skill_id: number;
  student_id: number;
  score: number;
  percentage: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  teacher_comment?: string;
  student_feedback?: string;
  is_passed: boolean;
  grade_point?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number;
  deleted_by?: number;
}

// Combined interfaces for API responses
export interface ExamWithSkills extends Exam {
  exam_skills: ExamSkill[];
  class?: {
    class_name: string;
    class_code: string;
    course_name?: string;
  };
}

export interface ExamResultWithDetails extends ExamResult {
  exam_skill: ExamSkill & {
    exam: Exam;
  };
  student: {
    student_code: string;
    full_name: string;
    email?: string;
  };
}

// New interface for 4-skill exam results display
export interface ExamResultsBySkills {
  exam_id: number;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  language: string;
  listening_score: number;
  listening_percentage: number;
  speaking_score: number;
  speaking_percentage: number;
  reading_score: number;
  reading_percentage: number;
  writing_score: number;
  writing_percentage: number;
  overall_average: number;
  overall_level: string;
}

// Bulk operations interfaces
export interface BulkExamResult {
  student_id: number;
  listening_score?: number;
  listening_comment?: string;
  speaking_score?: number;
  speaking_comment?: string;
  reading_score?: number;
  reading_comment?: string;
  writing_score?: number;
  writing_comment?: string;
}

export interface BulkExamCreation {
  exam: Omit<Exam, 'id'>;
  skills: Omit<ExamSkill, 'id' | 'exam_id'>[];
  results: BulkExamResult[];
}

// Statistics interfaces for new structure
export interface ExamStatistics {
  exam_id: number;
  exam_name: string;
  total_students: number;
  completed_students: number;
  average_score: number;
  pass_rate: number;
  skill_statistics: {
    skill_type: string;
    average_score: number;
    pass_rate: number;
    total_students: number;
  }[];
}

export interface StudentExamSummary {
  student_id: number;
  student_code: string;
  full_name: string;
  class_id: number;
  class_name: string;
  class_code: string;
  total_exams: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  skill_averages: {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
  };
  recent_exams: ExamResultsBySkills[];
  proficiency_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  overall_rating: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Cần cải thiện';
}

// Legacy interfaces (for backward compatibility)
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
