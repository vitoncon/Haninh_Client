import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError, of, switchMap } from 'rxjs';
import { ExamSkill } from '../models/exam-results.model';

@Injectable({
  providedIn: 'root'
})
export class ExamSkillsService {
  private readonly apiUrl = 'http://localhost:10093/api/exam_skills';
  
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
   * Get exam skills with optional filters
   */
  getExamSkills(filters?: {
    exam_id?: number | number[];
    skill_type?: string;
    include_deleted?: boolean;
  }): Observable<ExamSkill[]> {
    let params = new HttpParams();
    
    // ✅ Build conditions array for server
    const conditions: any[] = [];
    
    if (filters) {
      if (filters.exam_id) {
        const examIds = Array.isArray(filters.exam_id) 
          ? filters.exam_id.join(',') 
          : filters.exam_id.toString();
        conditions.push({ key: 'exam_id', value: examIds, compare: 'in' });
      }
      if (filters.skill_type) {
        conditions.push({ key: 'skill_type', value: filters.skill_type });
      }
      if (filters.include_deleted) {
        conditions.push({ key: 'include_deleted', value: 'true' });
      }
    }
    
    // Send conditions as JSON string
    if (conditions.length > 0) {
      params = params.set('condition', JSON.stringify(conditions));
    }

    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map(res => {
        // Handle both old and new API response formats
        const skills = res?.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        return skills as ExamSkill[];
      }),
      catchError(error => {
        console.error('Error fetching exam skills:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get exam skill by ID
   */
  getExamSkillById(id: number): Observable<ExamSkill> {
    return this.http.get<ExamSkill>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      map((response: any) => {
        // Handle different response formats
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error(`Error fetching exam skill ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get existing exam skill by exam_id and skill_type (including soft-deleted)
   */
  getExistingExamSkill(examId: number, skillType: string): Observable<ExamSkill | null> {
    return this.getExamSkills({
      exam_id: examId,
      skill_type: skillType,
      include_deleted: true
    }).pipe(
      map(skills => {
        const targetSkill = skills.find(skill => skill.skill_type === skillType);
        if (targetSkill) {
          return targetSkill;
        } else {
          return null;
        }
      }),
      catchError(error => {
        console.error(`❌ Error checking existing skill:`, error);
        return of(null);
      })
    );
  }

  /**
   * Create or reactivate exam skill
   */
  createOrReactivateExamSkill(skillData: ExamSkill): Observable<ExamSkill> {
    // First check if skill already exists
    return this.getExistingExamSkill(skillData.exam_id!, skillData.skill_type!).pipe(
      switchMap(existingSkill => {
        if (existingSkill) {
          if (existingSkill.is_deleted === 1) {
            // Reactivate soft-deleted skill
            return this.updateExamSkill(existingSkill.id!, {
              ...skillData,
              is_deleted: 0
            });
          } else {
            // Skill already exists and is active
            return throwError(() => new Error('Skill already exists'));
          }
        } else {
          // Create new skill
          return this.createExamSkill(skillData);
        }
      }),
      catchError(error => {
        console.error(`❌ Error in createOrReactivateExamSkill:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new exam skill using generic API
   */
  createExamSkill(skillData: ExamSkill): Observable<ExamSkill> {
    return this.http.post<any>(this.apiUrl, skillData, this.getAuthHeaders()).pipe(
      map(response => {
        return response.data || response;
      }),
      catchError(error => {
        console.error(`❌ Error creating exam skill:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update exam skill using generic API
   */
  updateExamSkill(skillId: number, skillData: Partial<ExamSkill>): Observable<ExamSkill> {
    return this.http.put<any>(`${this.apiUrl}/${skillId}`, skillData, this.getAuthHeaders()).pipe(
      map(response => {
        return response.data || response;
      }),
      catchError(error => {
        console.error(`❌ Error updating exam skill:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Soft delete exam skill using generic API
   */
  deleteExamSkill(skillId: number): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${skillId}`, this.getAuthHeaders()).pipe(
      map(() => {
        // Successfully deleted
      }),
      catchError(error => {
        console.error(`❌ Error soft deleting exam skill:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reactivate soft-deleted exam skill
   */
  reactivateExamSkill(skillId: number, skillData: Partial<ExamSkill>): Observable<ExamSkill> {
    return this.updateExamSkill(skillId, {
      ...skillData,
      is_deleted: 0
    });
  }
}

