import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { ExamWithSkills } from '../../study-results/models/exam-results.model';
import { CacheData, EXAM_CONSTANTS } from '../constants/exam.constants';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  classId: number;
  version: number;
  metadata?: {
    lastModified?: number;
    etag?: string;
    size?: number;
  };
}

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enableVersioning: boolean;
  enableCompression: boolean;
}

export interface StateSnapshot {
  exams: ExamWithSkills[];
  students: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private state$ = new BehaviorSubject<StateSnapshot>({
    exams: [],
    students: [],
    loading: false,
    error: null,
    lastUpdated: 0
  });

  private config: CacheConfig = {
    maxSize: 50,
    ttl: EXAM_CONSTANTS.CACHE_DURATION,
    enableVersioning: true,
    enableCompression: false
  };

  private versionCounter = 0;

  constructor() {
    // Clean up expired entries periodically
    this.startCleanupInterval();
  }

  /**
   * Get current state
   */
  getState(): Observable<StateSnapshot> {
    return this.state$.asObservable();
  }

  /**
   * Update state
   */
  updateState(updates: Partial<StateSnapshot>): void {
    const currentState = this.state$.value;
    const newState = {
      ...currentState,
      ...updates,
      lastUpdated: Date.now()
    };
    this.state$.next(newState);
  }

  /**
   * Cache exam data for a specific class
   */
  cacheExams(classId: number, exams: ExamWithSkills[]): void {
    const key = this.generateKey('exams', classId);
    const entry: CacheEntry<ExamWithSkills[]> = {
      data: [...exams],
      timestamp: Date.now(),
      classId,
      version: this.getNextVersion(),
      metadata: {
        lastModified: Date.now(),
        size: this.calculateSize(exams)
      }
    };

    this.setCacheEntry(key, entry);
    this.updateState({ exams: [...exams] });
  }

  /**
   * Get cached exams for a specific class
   */
  getCachedExams(classId: number): ExamWithSkills[] | null {
    const key = this.generateKey('exams', classId);
    const entry = this.getCacheEntry(key);
    
    if (entry && this.isValid(entry)) {
      return [...entry.data];
    }
    
    return null;
  }

  /**
   * Cache students data for a specific class
   */
  cacheStudents(classId: number, students: any[]): void {
    const key = this.generateKey('students', classId);
    const entry: CacheEntry<any[]> = {
      data: [...students],
      timestamp: Date.now(),
      classId,
      version: this.getNextVersion(),
      metadata: {
        lastModified: Date.now(),
        size: this.calculateSize(students)
      }
    };

    this.setCacheEntry(key, entry);
    this.updateState({ students: [...students] });
  }

  /**
   * Get cached students for a specific class
   */
  getCachedStudents(classId: number): any[] | null {
    const key = this.generateKey('students', classId);
    const entry = this.getCacheEntry(key);
    
    if (entry && this.isValid(entry)) {
      return [...entry.data];
    }
    
    return null;
  }

  /**
   * Update a specific exam in cache
   */
  updateExamInCache(classId: number, examId: number, updatedExam: ExamWithSkills): void {
    const exams = this.getCachedExams(classId);
    if (exams) {
      const index = exams.findIndex(exam => exam.id === examId);
      if (index !== -1) {
        exams[index] = { ...updatedExam };
        this.cacheExams(classId, exams);
      }
    }
  }

  /**
   * Remove an exam from cache
   */
  removeExamFromCache(classId: number, examId: number): void {
    const exams = this.getCachedExams(classId);
    if (exams) {
      const filteredExams = exams.filter(exam => exam.id !== examId);
      this.cacheExams(classId, filteredExams);
    }
  }

  /**
   * Add a new exam to cache
   */
  addExamToCache(classId: number, newExam: ExamWithSkills): void {
    const exams = this.getCachedExams(classId) || [];
    exams.push({ ...newExam });
    this.cacheExams(classId, exams);
  }

  /**
   * Invalidate cache for a specific class
   */
  invalidateClassCache(classId: number): void {
    const examKey = this.generateKey('exams', classId);
    const studentKey = this.generateKey('students', classId);
    
    this.cache.delete(examKey);
    this.cache.delete(studentKey);
    
    // Update state to reflect cache invalidation
    this.updateState({ 
      exams: [], 
      students: [], 
      error: null 
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.updateState({
      exams: [],
      students: [],
      loading: false,
      error: null,
      lastUpdated: 0
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: number;
    hitRate: number;
    memoryUsage: number;
  } {
    let totalSize = 0;
    let hitCount = 0;
    let missCount = 0;

    this.cache.forEach(entry => {
      totalSize += entry.metadata?.size || 0;
      // In a real implementation, you'd track hit/miss statistics
    });

    return {
      size: totalSize,
      entries: this.cache.size,
      hitRate: hitCount / (hitCount + missCount) || 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < this.config.ttl;
  }

  /**
   * Set cache entry with size management
   */
  private setCacheEntry(key: string, entry: CacheEntry<any>): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldestEntries();
    }

    this.cache.set(key, entry);
  }

  /**
   * Get cache entry
   */
  private getCacheEntry(key: string): CacheEntry<any> | undefined {
    return this.cache.get(key);
  }

  /**
   * Generate cache key
   */
  private generateKey(type: string, classId: number): string {
    return `${type}_${classId}`;
  }

  /**
   * Get next version number
   */
  private getNextVersion(): number {
    return ++this.versionCounter;
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 0;
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += entry.metadata?.size || 0;
    });
    return totalSize;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.ttl / 2); // Clean up every half TTL period
  }

  /**
   * Remove expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if ((now - entry.timestamp) >= this.config.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });
  }

  /**
   * Preload data for better performance
   */
  preloadClassData(classId: number): Observable<boolean> {
    // In a real implementation, you would preload related data
    // like students, skills, etc. to improve user experience
    return of(true);
  }

  /**
   * Optimize cache for specific usage patterns
   */
  optimizeCache(): void {
    // Analyze usage patterns and optimize cache configuration
    // This could include adjusting TTL, size limits, etc.
  }

  /**
   * Export cache for debugging
   */
  exportCache(): any {
    const exportData: any = {};
    this.cache.forEach((entry, key) => {
      exportData[key] = {
        timestamp: entry.timestamp,
        classId: entry.classId,
        version: entry.version,
        metadata: entry.metadata,
        dataSize: entry.metadata?.size || 0
      };
    });
    return exportData;
  }

  /**
   * Import cache from backup
   */
  importCache(cacheData: any): void {
    // In a real implementation, you would restore cache from backup
    // This is useful for offline support or data recovery
  }
}
