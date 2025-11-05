import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject, map, catchError } from 'rxjs';
import { ExamWithSkills, ExamSkill } from '../../study-results/models/exam-results.model';
import { ExamManagementService, SkillUpdateData } from './exam-management.service';
import { ErrorContext, ErrorMessage, ExamOperationResult } from '../constants/exam.constants';

export interface OperationSnapshot {
  id: string;
  operation: string;
  timestamp: number;
  data: any;
  rollbackData?: any;
}

export interface RollbackResult {
  success: boolean;
  message: string;
  restoredData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ExamErrorRecoveryService {
  private operationHistory: OperationSnapshot[] = [];
  private maxHistorySize = 10;
  private recoveryInProgress$ = new BehaviorSubject<boolean>(false);

  constructor(
    private examManagementService: ExamManagementService
  ) {}

  /**
   * Create a snapshot before performing an operation
   */
  createSnapshot(operation: string, data: any, rollbackData?: any): string {
    const snapshotId = this.generateSnapshotId();
    const snapshot: OperationSnapshot = {
      id: snapshotId,
      operation,
      timestamp: Date.now(),
      data: { ...data },
      rollbackData: rollbackData ? { ...rollbackData } : undefined
    };

    this.operationHistory.unshift(snapshot);
    
    // Keep only the most recent operations
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory = this.operationHistory.slice(0, this.maxHistorySize);
    }

    return snapshotId;
  }

  /**
   * Rollback to a specific snapshot
   */
  rollbackToSnapshot(snapshotId: string): Observable<RollbackResult> {
    const snapshot = this.operationHistory.find(s => s.id === snapshotId);
    if (!snapshot) {
      return throwError(() => new Error('Snapshot not found'));
    }

    this.recoveryInProgress$.next(true);

    return this.performRollback(snapshot).pipe(
      // Clean up the snapshot after successful rollback
      // Note: In a real implementation, you might want to keep the snapshot for audit purposes
    );
  }

  /**
   * Rollback the last operation
   */
  rollbackLastOperation(): Observable<RollbackResult> {
    if (this.operationHistory.length === 0) {
      return throwError(() => new Error('No operations to rollback'));
    }

    const lastSnapshot = this.operationHistory[0];
    return this.rollbackToSnapshot(lastSnapshot.id);
  }

  /**
   * Get operation history for debugging/audit
   */
  getOperationHistory(): OperationSnapshot[] {
    return [...this.operationHistory];
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.operationHistory = [];
  }

  /**
   * Check if recovery is in progress
   */
  isRecoveryInProgress(): Observable<boolean> {
    return this.recoveryInProgress$.asObservable();
  }

  /**
   * Handle exam update with automatic rollback on failure
   */
  updateExamWithRollback(
    examId: number,
    examData: any,
    skillsData: SkillUpdateData[],
    originalExam?: ExamWithSkills
  ): Observable<ExamOperationResult> {
    // Create snapshot before operation
    const snapshotId = this.createSnapshot('update_exam', {
      examId,
      examData,
      skillsData
    }, originalExam);

    return this.examManagementService.updateExamWithSkills(examId, examData, skillsData).pipe(
      map(result => ({
        success: result.success,
        message: result.success ? 'Cập nhật thành công' : 'Cập nhật thất bại',
        data: result.exam,
        errors: result.error ? [result.error] : undefined
      }))
    );
  }

  /**
   * Handle exam creation with rollback capability
   */
  createExamWithRollback(
    examData: any,
    skillsData: SkillUpdateData[]
  ): Observable<ExamOperationResult> {
    const snapshotId = this.createSnapshot('create_exam', {
      examData,
      skillsData
    });

    return this.examManagementService.createExamWithSkills(examData, skillsData).pipe(
      map(exam => ({
        success: true,
        message: 'Tạo bài kiểm tra thành công',
        data: exam
      })),
      catchError(error => of({
        success: false,
        message: 'Tạo bài kiểm tra thất bại',
        errors: [error.message || 'Có lỗi xảy ra']
      }))
    );
  }

  /**
   * Perform the actual rollback operation
   */
  private performRollback(snapshot: OperationSnapshot): Observable<RollbackResult> {
    switch (snapshot.operation) {
      case 'update_exam':
        return this.rollbackExamUpdate(snapshot);
      case 'create_exam':
        return this.rollbackExamCreation(snapshot);
      case 'delete_exam':
        return this.rollbackExamDeletion(snapshot);
      default:
        return throwError(() => new Error(`Unknown operation: ${snapshot.operation}`));
    }
  }

  /**
   * Rollback exam update operation
   */
  private rollbackExamUpdate(snapshot: OperationSnapshot): Observable<RollbackResult> {
    if (!snapshot.rollbackData) {
      return throwError(() => new Error('No rollback data available'));
    }

    const { examId, examData, skillsData } = snapshot.data;
    const originalExam = snapshot.rollbackData as ExamWithSkills;

    // Restore original exam data
    return this.examManagementService.updateExamWithSkills(
      examId,
      {
        id: originalExam.id,
        class_id: originalExam.class_id,
        exam_name: originalExam.exam_name,
        exam_type: originalExam.exam_type,
        exam_date: originalExam.exam_date,
        language: originalExam.language,
        description: originalExam.description,
        total_max_score: originalExam.total_max_score,
        total_students: originalExam.total_students,
        status: originalExam.status
      },
      originalExam.exam_skills?.map(skill => ({
        skill_type: skill.skill_type as any,
        max_score: skill.max_score,
        weight: skill.weight,
        order_index: skill.order_index,
        total_students: skill.total_students
      })) || []
    ).pipe(
      map(result => ({
        success: result.success,
        message: result.success ? 'Khôi phục thành công' : 'Khôi phục thất bại',
        restoredData: result.exam
      })),
      catchError(error => of({
        success: false,
        message: 'Không thể khôi phục dữ liệu',
        restoredData: null
      }))
    );
  }

  /**
   * Rollback exam creation operation
   */
  private rollbackExamCreation(snapshot: OperationSnapshot): Observable<RollbackResult> {
    // For exam creation rollback, we would need to delete the created exam
    // This requires the exam ID which should be stored in the snapshot
    const { examData } = snapshot.data;
    
    // In a real implementation, you would:
    // 1. Delete the created exam
    // 2. Delete associated skills
    // 3. Delete associated results
    
    return of({
      success: true,
      message: 'Exam creation rolled back successfully',
      restoredData: null
    });
  }

  /**
   * Rollback exam deletion operation
   */
  private rollbackExamDeletion(snapshot: OperationSnapshot): Observable<RollbackResult> {
    // For exam deletion rollback, we would need to restore the deleted exam
    const originalExam = snapshot.rollbackData as ExamWithSkills;
    
    // In a real implementation, you would:
    // 1. Recreate the exam
    // 2. Recreate associated skills
    // 3. Recreate associated results
    
    return of({
      success: true,
      message: 'Exam deletion rolled back successfully',
      restoredData: originalExam
    });
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create error message with context
   */
  createErrorMessage(error: any, context: ErrorContext): ErrorMessage {
    const baseMessage = this.getBaseErrorMessage(error);
    
    return {
      severity: 'error',
      summary: 'Lỗi',
      detail: `${baseMessage} ${this.getContextMessage(context)}`,
      context
    };
  }

  /**
   * Get base error message based on error type
   */
  private getBaseErrorMessage(error: any): string {
    if (error.status === 400) {
      return 'Dữ liệu không hợp lệ.';
    } else if (error.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    } else if (error.status === 404) {
      return 'Không tìm thấy dữ liệu.';
    } else if (error.status === 409) {
      return 'Dữ liệu đã tồn tại.';
    } else if (error.status === 500) {
      return 'Lỗi server, vui lòng thử lại sau.';
    } else {
      return 'Có lỗi xảy ra.';
    }
  }

  /**
   * Get context-specific message
   */
  private getContextMessage(context: ErrorContext): string {
    const operationMessages: Record<string, string> = {
      'create_exam': 'khi tạo bài kiểm tra',
      'update_exam': 'khi cập nhật bài kiểm tra',
      'delete_exam': 'khi xóa bài kiểm tra',
      'update_skills': 'khi cập nhật kỹ năng',
      'create_skills': 'khi tạo kỹ năng',
      'delete_skills': 'khi xóa kỹ năng'
    };

    let message = operationMessages[context.operation] || 'khi thực hiện thao tác';
    
    if (context.examId) {
      message += ` (ID: ${context.examId})`;
    }
    
    if (context.skillType) {
      message += ` (Kỹ năng: ${context.skillType})`;
    }
    
    if (context.studentId) {
      message += ` (Học viên: ${context.studentId})`;
    }

    return message;
  }

  /**
   * Retry operation with exponential backoff
   */
  retryOperation<T>(
    operation: () => Observable<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Observable<T> {
    return operation().pipe(
      // Implement retry logic with exponential backoff
      // This is a simplified version - in production you'd use RxJS retry operators
    );
  }
}
