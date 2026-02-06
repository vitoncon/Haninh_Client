import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// ================= MODEL =================
export interface Certificate {
  id: number;
  certificateCode: string;
  certificateName: string;

  studentId: number;
  studentName: string;

  classId?: number;
  className?: string;

  issueDate?: string;
  expiryDate?: string;

  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
}

// ================= SERVICE =================
@Injectable({
  providedIn: 'root'
})
export class CertificatesService {

  // ================= MOCK DATABASE =================
  private certificates: Certificate[] = [
    {
      id: 1,
      certificateCode: 'CERT001',
      certificateName: 'Angular Developer',
      studentId: 1,
      studentName: 'Nguyễn Văn An',
      classId: 1,
      className: 'Angular Basic',
      issueDate: '2024-01-01',
      expiryDate: '2026-01-01',
      status: 'ACTIVE'
    },
    {
      id: 2,
      certificateCode: 'CERT002',
      certificateName: 'Java Spring Boot',
      studentId: 2,
      studentName: 'Trần Thị Bình',
      classId: 2,
      className: 'Spring Boot Pro',
      issueDate: '2023-01-01',
      expiryDate: '2024-01-01',
      status: 'EXPIRED'
    },
    {
      id: 3,
      certificateCode: 'CERT003',
      certificateName: 'UI/UX Design',
      studentId: 3,
      studentName: 'Lê Minh Cường',
      classId: 3,
      className: 'UI Design Master',
      issueDate: '',
      expiryDate: '',
      status: 'PENDING'
    }
  ];

  // ================= GET ALL =================
  getAll(): Observable<Certificate[]> {
    return of([...this.certificates]);
  }

  // ================= GET BY ID =================
  getById(id: number): Observable<Certificate | undefined> {
    return of(this.certificates.find(c => c.id === id));
  }

  // ================= CREATE =================
  create(data: Certificate): Observable<Certificate> {

    const newItem: Certificate = {
      ...data,
      id: Date.now()
    };

    this.certificates.push(newItem);

    return of(newItem);
  }

  // ================= UPDATE =================
  update(id: number, data: Certificate): Observable<Certificate> {

    const index = this.certificates.findIndex(c => c.id === id);

    if (index !== -1) {
      this.certificates[index] = { ...data, id };
    }

    return of(this.certificates[index]);
  }

  // ================= DELETE =================
  delete(id: number): Observable<boolean> {

    this.certificates = this.certificates.filter(c => c.id !== id);

    return of(true);
  }

  // ================= SUMMARY =================
  getSummary(): Observable<{
    total: number;
    active: number;
    expired: number;
    pending: number;
  }> {

    const total = this.certificates.length;

    const active = this.certificates.filter(c => c.status === 'ACTIVE').length;

    const expired = this.certificates.filter(c =>
      c.status === 'EXPIRED' ||
      (c.expiryDate && new Date(c.expiryDate) < new Date())
    ).length;

    const pending = this.certificates.filter(c => c.status === 'PENDING').length;

    return of({
      total,
      active,
      expired,
      pending
    });
  }

}
