import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Course, CourseFilters, CourseStatistics } from '../models/courses.model';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private readonly apiUrl = 'http://localhost:10093/api/courses';
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  
  // Cache for courses data
  private coursesCache: Course[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('accessToken') || '';
    return {
      headers: this.httpOptions.headers.set('Authorization', `Bearer ${token}`)
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
    }
    
    console.error('CoursesService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // Method to clear cache when needed (e.g., after add/update/delete)
  clearCache(): void {
    this.coursesCache = null;
    this.cacheTimestamp = 0;
  }

  getCourses(filters?: CourseFilters): Observable<Course[]> {
    let params = new HttpParams();
    
    if (filters?.search) {
      params = params.set('q', filters.search);
    }
    
    if (filters?.language) {
      params = params.set('language', filters.language);
    }
    
    if (filters?.level) {
      params = params.set('level', filters.level);
    }
    
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    
    if (filters?.minDuration != null) {
      params = params.set('minDuration', String(filters.minDuration));
    }
    
    if (filters?.maxDuration != null) {
      params = params.set('maxDuration', String(filters.maxDuration));
    }
    
    if (filters?.minTuitionFee != null) {
      params = params.set('minTuitionFee', String(filters.minTuitionFee));
    }
    
    if (filters?.maxTuitionFee != null) {
      params = params.set('maxTuitionFee', String(filters.maxTuitionFee));
    }

    return this.http.get<any>(this.apiUrl, { ...this.getAuthHeaders(), params }).pipe(
      map((res) => res?.data ?? res),
      catchError(this.handleError)
    );
  }

  getCourseById(id: number): Observable<Course> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid course ID'));
    }
    
    // Check if we have valid cached data
    const now = Date.now();
    if (this.coursesCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      const course = this.coursesCache.find(c => c.id === id);
      if (course) {
        return new Observable(observer => observer.next(course));
      } else {
        return throwError(() => new Error(`Course with ID ${id} not found`));
      }
    }
    
    // Fetch fresh data and cache it
    return this.http.get<any>(this.apiUrl, this.getAuthHeaders()).pipe(
      map((res) => {
        const courses = res?.data ?? res;
        
        if (Array.isArray(courses)) {
          // Cache the data
          this.coursesCache = courses as Course[];
          this.cacheTimestamp = now;
          
          const course = courses.find(c => c.id === id);
          if (course) {
            return course as Course;
          } else {
            throw new Error(`Course with ID ${id} not found`);
          }
        } else {
          throw new Error('Invalid response format');
        }
      }),
      catchError(this.handleError)
    );
  }

  addCourse(course: Course): Observable<Course> {
    if (!course.course_code || !course.course_name) {
      return throwError(() => new Error('Course code and name are required'));
    }

    return this.http.post<Course>(this.apiUrl, course, this.getAuthHeaders()).pipe(
      map((res) => {
        this.clearCache(); // Clear cache after adding new course
        return res;
      }),
      catchError(this.handleError)
    );
  }

  updateCourse(id: number, course: Course): Observable<Course> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid course ID'));
    }

    return this.http.put<Course>(`${this.apiUrl}/${id}`, course, this.getAuthHeaders()).pipe(
      map((res) => {
        this.clearCache(); // Clear cache after updating course
        return res;
      }),
      catchError(this.handleError)
    );
  }

  deleteCourse(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid course ID'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      map(() => {
        this.clearCache(); // Clear cache after deleting course
      }),
      catchError(this.handleError)
    );
  }

  getCourseStatistics(): Observable<CourseStatistics> {
    return this.http.get<any>(this.apiUrl, this.getAuthHeaders()).pipe(
      map((res) => {
        const courses = res?.data ?? res;
        if (Array.isArray(courses)) {
          return this.calculateCourseStatistics(courses);
        }
        return this.getDefaultCourseStatistics();
      }),
      catchError(this.handleError)
    );
  }

  private calculateCourseStatistics(courses: Course[]): CourseStatistics {
    const total_courses = courses.length;
    const active_courses = courses.filter(c => c.status === 'Đang hoạt động').length;
    const inactive_courses = courses.filter(c => c.status === 'Không hoạt động').length;
    
    const tuitionFees = courses.filter(c => c.tuition_fee != null).map(c => c.tuition_fee!);
    const average_tuition_fee = tuitionFees.length > 0 
      ? Math.round(tuitionFees.reduce((sum, fee) => sum + fee, 0) / tuitionFees.length)
      : 0;

    const durations = courses.filter(c => c.duration_weeks != null).map(c => c.duration_weeks!);
    const average_duration_weeks = durations.length > 0 
      ? Math.round(durations.reduce((sum, dur) => sum + dur, 0) / durations.length * 10) / 10
      : 0;

    const totalHours = courses.filter(c => c.total_hours != null).map(c => c.total_hours!);
    const average_total_hours = totalHours.length > 0 
      ? Math.round(totalHours.reduce((sum, hours) => sum + hours, 0) / totalHours.length)
      : 0;

    // Language distribution
    const languageCount = courses.reduce((acc, c) => {
      const lang = c.language || 'Chưa xác định';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const language_distribution = Object.entries(languageCount).map(([language, count]) => ({
      language,
      count: count as number
    }));

    // Level distribution
    const levelCount = courses.reduce((acc, c) => {
      const level = c.level || 'Chưa xác định';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const level_distribution = Object.entries(levelCount).map(([level, count]) => ({
      level,
      count: count as number
    }));

    return {
      total_courses,
      active_courses,
      inactive_courses,
      language_distribution,
      level_distribution,
      average_tuition_fee,
      average_duration_weeks,
      average_total_hours
    };
  }

  private getDefaultCourseStatistics(): CourseStatistics {
    return {
      total_courses: 0,
      active_courses: 0,
      inactive_courses: 0,
      language_distribution: [],
      level_distribution: [],
      average_tuition_fee: 0,
      average_duration_weeks: 0,
      average_total_hours: 0
    };
  }

  validateCourseCode(code: string): Observable<boolean> {
    return this.http.get<any>(this.apiUrl, this.getAuthHeaders()).pipe(
      map((res) => {
        const courses = res?.data ?? res;
        if (Array.isArray(courses)) {
          const existingCourse = courses.find((course: any) => course.course_code === code);
          return !existingCourse;
        }
        return true;
      }),
      catchError(this.handleError)
    );
  }

  generateCourseCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `KH${timestamp}${random}`;
  }
}
