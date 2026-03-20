import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = '/api/reports';

  constructor(private http: HttpClient) {}

  exportStudentResults(studentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/student/${studentId}`, {
      responseType: 'blob'
    });
  }

  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
