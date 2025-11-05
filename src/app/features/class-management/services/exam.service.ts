import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError, of } from 'rxjs';

export interface Exam {
  id: number;
  class_id: number;
  exam_name: string;
  exam_type: 'Kiểm tra định kỳ' | 'Kiểm tra giữa kỳ' | 'Kiểm tra cuối kỳ' | 'Kiểm tra tổng hợp';
  exam_date: string;
  language: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung';
  max_score: number;
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  approved_by?: number;
  approved_at?: string;
  approved_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamCreateRequest {
  class_id: number;
  exam_name: string;
  exam_type: 'Kiểm tra định kỳ' | 'Kiểm tra giữa kỳ' | 'Kiểm tra cuối kỳ' | 'Kiểm tra tổng hợp';
  exam_date: string;
  language: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung';
  max_score: number;
}

export interface ExamUpdateRequest {
  exam_name?: string;
  exam_type?: 'Kiểm tra định kỳ' | 'Kiểm tra giữa kỳ' | 'Kiểm tra cuối kỳ' | 'Kiểm tra tổng hợp';
  exam_date?: string;
  language?: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung';
  max_score?: number;
  status?: 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled';
}

export interface ExamApproveRequest {
  approved_by: number;
  approved_by_name: string;
}

export interface ExamFilters {
  class_id?: number;
  status?: string;
  exam_type?: string;
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private readonly apiUrl = 'http://localhost:10093/api/exams';
  
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  /**
   * Lấy danh sách bài kiểm tra với filters (giống logic cũ của study-results)
   */
  getExams(filters?: ExamFilters): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.class_id) {
        params = params.set('class_id', filters.class_id.toString());
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.exam_type) {
        params = params.set('exam_type', filters.exam_type);
      }
      if (filters.language) {
        params = params.set('language', filters.language);
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
    }

    return this.http.get(this.apiUrl, { 
      ...this.getAuthHeaders(),
      params 
    }).pipe(
      map((response: any) => {
        // Handle different response formats
        if (Array.isArray(response)) {
          return { data: response, total: response.length };
        }
        return response;
      }),
      catchError(error => {
        console.error('Error fetching exams:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy exam results với details (giống getStudyResultsWithDetails cũ)
   */
  getExamResultsWithDetails(filters?: any): Observable<any[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get(this.apiUrl, { 
      ...this.getAuthHeaders(),
      params 
    }).pipe(
      map((response: any) => {
        // Handle different response formats
        if (Array.isArray(response)) {
          return response;
        } else if (response?.data) {
          return Array.isArray(response.data) ? response.data : [response.data];
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching exam results with details:', error);
        return of([]); // Return empty array instead of throwing error
      })
    );
  }

  /**
   * Lấy bài kiểm tra theo ID
   */
  getExamById(id: number): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      map((response: any) => {
        // Handle different response formats
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error(`Error fetching exam ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy bài kiểm tra theo class_id
   */
  getExamsByClass(classId: number): Observable<Exam[]> {
    return this.getExams({ class_id: classId }).pipe(
      map(response => response.data || response),
      catchError(error => {
        console.error(`Error fetching exams for class ${classId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Tạo bài kiểm tra mới
   */
  createExam(exam: ExamCreateRequest): Observable<Exam> {
    return this.http.post<Exam>(this.apiUrl, exam, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error('Error creating exam:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cập nhật bài kiểm tra
   */
  updateExam(id: number, exam: ExamUpdateRequest): Observable<Exam> {
    return this.http.put<Exam>(`${this.apiUrl}/${id}`, exam, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error(`Error updating exam ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Duyệt bài kiểm tra (sử dụng PUT thay vì PATCH)
   */
  approveExam(id: number, approveData: ExamApproveRequest): Observable<Exam> {
    return this.http.put<Exam>(`${this.apiUrl}/${id}`, approveData, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error(`Error approving exam ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mở khóa bài kiểm tra (sử dụng PUT thay vì PATCH)
   */
  unlockExam(id: number): Observable<Exam> {
    // Set status back to 'cancelled' (which maps to 'review') to unlock the exam
    return this.http.put<Exam>(`${this.apiUrl}/${id}`, { status: 'cancelled' }, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error(`Error unlocking exam ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Xóa bài kiểm tra (soft delete)
   */
  deleteExam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      catchError(error => {
        console.error(`Error deleting exam ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy thống kê bài kiểm tra
   */
  getExamStatistics(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/statistics`, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error(`Error fetching statistics for exam ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cập nhật trạng thái bài kiểm tra
   */
  updateExamStatus(id: number, status: string): Observable<Exam> {
    return this.updateExam(id, { status: status as any }).pipe(
      catchError(error => {
        console.error(`Error updating exam ${id} status to ${status}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy lịch sử thay đổi trạng thái
   */
  getExamStatusHistory(id: number): Observable<any[]> {
    return this.http.get(`${this.apiUrl}/${id}/status-history`, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error(`Error fetching status history for exam ${id}:`, error);
        return of([]); // Return empty array instead of throwing error
      })
    );
  }
}
