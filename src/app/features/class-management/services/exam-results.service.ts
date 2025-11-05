import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError, of } from 'rxjs';

export interface ExamResult {
  id: number;
  exam_skill_id: number;
  student_id: number;
  score: number;
  // percentage?: number; // Removed from DB - calculated on the fly from score / max_score
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  teacher_comment: string;
  student_feedback: string;
  is_passed: boolean;
  grade_point: number;
  created_at: string;
  updated_at: string;
}

export interface ExamResultFilters {
  exam_skill_id?: number;
  student_id?: number;
  exam_id?: number;
  class_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamResultsService {
  private readonly apiUrl = 'http://localhost:10093/api/exam_results';
  
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
   * Lấy exam results với filters
   */
  getExamResults(filters?: ExamResultFilters): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof ExamResultFilters] !== undefined && 
            filters[key as keyof ExamResultFilters] !== null && 
            filters[key as keyof ExamResultFilters] !== '') {
          params = params.set(key, filters[key as keyof ExamResultFilters]!.toString());
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
          return { data: response, total: response.length };
        }
        return response;
      }),
      catchError(error => {
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
      // Convert filters to backend condition format
      const conditions: any[] = [];
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          conditions.push({
            key: key,
            value: filters[key].toString(),
            compare: '='
          });
        }
      });
      
      if (conditions.length > 0) {
        params = params.set('condition', JSON.stringify(conditions));
      }
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
        return of([]); // Return empty array instead of throwing error
      })
    );
  }

  /**
   * Lấy exam result theo ID
   */
  getExamResultById(id: number): Observable<ExamResult> {
    return this.http.get<ExamResult>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Tạo exam result mới
   */
  createExamResult(examResult: Partial<ExamResult>): Observable<ExamResult> {
    return this.http.post<ExamResult>(this.apiUrl, examResult, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Cập nhật exam result
   */
  updateExamResult(id: number, examResult: Partial<ExamResult>): Observable<ExamResult> {
    return this.http.put<ExamResult>(`${this.apiUrl}/${id}`, examResult, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Xóa exam result (soft delete)
   */
  deleteExamResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}

