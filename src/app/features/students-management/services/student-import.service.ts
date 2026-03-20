import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImportRow {
  name: string;
  email: string;
  phone: string;
  class_id: number;
  date_of_birth?: string;
  [key: string]: any;
}

export interface ValidationResult {
  row: ImportRow;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StudentImportService {
  private apiUrl = '/api/students/import';

  constructor(private http: HttpClient) {}

  preview(file: File): Observable<{ data: ValidationResult[], summary: any }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ data: ValidationResult[], summary: any }>(`${this.apiUrl}/preview`, formData);
  }

  import(validRows: ImportRow[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm`, { validRows });
  }
}
