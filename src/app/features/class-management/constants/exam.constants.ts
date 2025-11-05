// Constants for exam management
export const EXAM_CONSTANTS = {
  DEFAULT_SKILL_SCORE: 25,
  DEFAULT_SKILL_WEIGHT: 1.0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  OPERATION_DELAY: 200, // ms
  BATCH_SIZE: 5,
  MAX_SCORE: 100,
  MIN_SCORE: 1,
  PASS_THRESHOLD: 60
} as const;

// Type-safe interfaces for better maintainability
export interface SelectedSkill {
  skillType: 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp';
  selected: boolean;
  maxScore: number;
  weight: number;
  orderIndex: number;
  hasStudentScores?: boolean;
}

export interface ExamFormData {
  exam_name: string;
  exam_type: 'Kiểm tra định kỳ' | 'Kiểm tra giữa kỳ' | 'Kiểm tra cuối kỳ' | 'Kiểm tra trình độ' | 'Thi thử chứng chỉ';
  exam_date: string | Date;
  description?: string;
  total_max_score: number;
  status?: 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled';
}

export interface BulkExamFormData {
  exam: ExamFormData;
  skills: Array<{
    skill_type: 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp';
    max_score: number;
    weight: number;
    order_index: number;
  }>;
}

export interface ExamStatistics {
  totalExams: number;
  completedExams: number;
  averageScore: number;
  passRate: number;
  totalStudents: number;
}

export interface ExamOperationResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export interface CacheData<T> {
  data: T;
  timestamp: number;
  classId: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Enum-like constants for better type safety
export const EXAM_TYPES = {
  PERIODIC: 'Kiểm tra định kỳ',
  MIDTERM: 'Kiểm tra giữa kỳ',
  FINAL: 'Kiểm tra cuối kỳ',
  LEVEL: 'Kiểm tra trình độ',
  CERTIFICATE: 'Thi thử chứng chỉ'
} as const;

export const SKILL_TYPES = {
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  COMPREHENSIVE: 'Tổng hợp'
} as const;

export const EXAM_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const SKILL_SEVERITY_MAP = {
  [SKILL_TYPES.LISTENING]: 'info' as const,
  [SKILL_TYPES.SPEAKING]: 'success' as const,
  [SKILL_TYPES.READING]: 'warn' as const,
  [SKILL_TYPES.WRITING]: 'danger' as const,
  [SKILL_TYPES.COMPREHENSIVE]: 'contrast' as const
} as const;

export const STATUS_SEVERITY_MAP = {
  [EXAM_STATUS.DRAFT]: 'secondary' as const,
  [EXAM_STATUS.IN_PROGRESS]: 'info' as const,
  [EXAM_STATUS.REVIEW]: 'warn' as const,
  [EXAM_STATUS.COMPLETED]: 'success' as const,
  [EXAM_STATUS.CANCELLED]: 'danger' as const
} as const;

export const STATUS_LABEL_MAP = {
  [EXAM_STATUS.DRAFT]: 'Nháp',
  [EXAM_STATUS.IN_PROGRESS]: 'Đang nhập điểm',
  [EXAM_STATUS.REVIEW]: 'Chờ duyệt',
  [EXAM_STATUS.COMPLETED]: 'Đã công bố',
  [EXAM_STATUS.CANCELLED]: 'Hủy bỏ'
} as const;

// Utility types
export type ExamType = typeof EXAM_TYPES[keyof typeof EXAM_TYPES];
export type SkillType = typeof SKILL_TYPES[keyof typeof SKILL_TYPES];
export type ExamStatus = typeof EXAM_STATUS[keyof typeof EXAM_STATUS];
export type SeverityType = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

// Error handling types
export interface ErrorContext {
  operation: string;
  examId?: number;
  skillType?: string;
  studentId?: number;
}

export interface ErrorMessage {
  severity: 'error' | 'warn' | 'info' | 'success';
  summary: string;
  detail: string;
  context?: ErrorContext;
}

// Form validation types
export interface FormValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
}

export interface FormValidationConfig {
  rules: FormValidationRule[];
  customValidators?: Array<(formData: any) => ValidationResult>;
}
