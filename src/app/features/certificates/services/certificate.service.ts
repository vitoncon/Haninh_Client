import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, switchMap, catchError, of } from 'rxjs';
import { Certificate, StudentCertificate, StudentCertificateWithDetails, CertificateFilters, CertificateStatistics } from '../models/certificates.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private certificatesApiUrl = 'http://localhost:10093/api/certificates';
  private studentCertificatesApiUrl = 'http://localhost:10093/api/student-certificates';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('accessToken') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  // Certificate management
  getCertificates(q?: string): Observable<Certificate[]> {
    const url = q && q.trim().length > 0 ? `${this.certificatesApiUrl}?q=${encodeURIComponent(q.trim())}` : this.certificatesApiUrl;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getCertificateById(id: number): Observable<Certificate> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "id",
      value: id.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.certificatesApiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => {
        const data = res?.data ?? res;
        if (Array.isArray(data)) {
          const certificate = data.find(cert => cert.id === id);
          if (certificate) {
            return certificate;
          }
        }
        throw new Error('Certificate not found');
      })
    );
  }

  addCertificate(certificate: Certificate): Observable<Certificate> {
    return this.http.post<Certificate>(this.certificatesApiUrl, certificate, this.getAuthHeaders());
  }

  updateCertificate(id: number, certificate: Certificate): Observable<Certificate> {
    return this.http.put<Certificate>(`${this.certificatesApiUrl}/${id}`, certificate, this.getAuthHeaders());
  }

  deleteCertificate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.certificatesApiUrl}/${id}`, this.getAuthHeaders());
  }

  // Student Certificate management
  getStudentCertificates(q?: string): Observable<StudentCertificateWithDetails[]> {
    const url = q && q.trim().length > 0 ? `${this.studentCertificatesApiUrl}?q=${encodeURIComponent(q.trim())}` : this.studentCertificatesApiUrl;
    
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res),
      switchMap((data: any[]) => {
        // Always enrich data to ensure we have complete information
        if (data.length > 0) {
          return this.enrichStudentCertificatesData(data);
        }
        return [data];
      })
    );
  }

  // Enrich student certificates data with related information
  private enrichStudentCertificatesData(certificates: any[]): Observable<StudentCertificateWithDetails[]> {
    return new Observable(observer => {
      const enrichedData: StudentCertificateWithDetails[] = [];
      let processedCount = 0;

      if (certificates.length === 0) {
        observer.next(enrichedData);
        observer.complete();
        return;
      }

      certificates.forEach((cert, index) => {
        // Fetch student info
        const studentPromise = this.getStudentById(cert.student_id);
        // Fetch certificate type info
        const certificatePromise = this.getCertificateTypeById(cert.certificate_id).toPromise();
        // Fetch class info if class_id exists
        const classPromise = cert.class_id ? this.getClassById(cert.class_id) : Promise.resolve(null);

        Promise.all([studentPromise, certificatePromise, classPromise])
          .then(([student, certificateType, classInfo]) => {
            enrichedData[index] = {
              ...cert,
              student_name: student?.full_name || 'N/A',
              student_code: student?.student_code || 'N/A',
              certificate_name: certificateType?.certificate_name || 'N/A',
              certificate_code: certificateType?.certificate_code || 'N/A',
              class_name: classInfo?.class_name || null,
              class_code: classInfo?.class_code || null
            };

            processedCount++;
            if (processedCount === certificates.length) {
              observer.next(enrichedData);
              observer.complete();
            }
          })
          .catch(error => {
            console.error(`Error enriching certificate ${index + 1}:`, error);
            enrichedData[index] = {
              ...cert,
              student_name: 'N/A',
              student_code: 'N/A',
              certificate_name: 'N/A',
              certificate_code: 'N/A',
              class_name: null,
              class_code: null
            };

            processedCount++;
            if (processedCount === certificates.length) {
              observer.next(enrichedData);
              observer.complete();
            }
          });
      });
    });
  }

  // Helper methods to get individual records
  private getStudentById(id: number): Promise<any> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "id",
      value: id.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    const url = `http://localhost:10093/api/students?condition=${condition}`;
    
    return this.http.get<any>(url, this.getAuthHeaders())
      .pipe(map((res) => {
        const data = res?.data ?? res;
        
        // Find the correct student by ID instead of taking data[0]
        const student = Array.isArray(data) ? data.find(s => s.id === id) : null;
        
        return student;
      }))
      .toPromise();
  }

  private getClassById(id: number): Promise<any> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "id",
      value: id.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`http://localhost:10093/api/classes?condition=${condition}`, this.getAuthHeaders())
      .pipe(map((res) => {
        const data = res?.data ?? res;
        // Find the correct class by ID instead of taking data[0]
        return Array.isArray(data) ? data.find(c => c.id === id) : null;
      }))
      .toPromise();
  }

  getStudentCertificatesWithDetails(filters?: CertificateFilters): Observable<StudentCertificateWithDetails[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.certificate_id) params = params.set('certificate_id', filters.certificate_id.toString());
      if (filters.student_id) params = params.set('student_id', filters.student_id.toString());
      if (filters.class_id) params = params.set('class_id', filters.class_id.toString());
      if (filters.status) params = params.set('status', filters.status);
      if (filters.issued_date_from) params = params.set('issued_date_from', filters.issued_date_from);
      if (filters.issued_date_to) params = params.set('issued_date_to', filters.issued_date_to);
      if (filters.expiry_date_from) params = params.set('expiry_date_from', filters.expiry_date_from);
      if (filters.expiry_date_to) params = params.set('expiry_date_to', filters.expiry_date_to);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.studentCertificatesApiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getStudentCertificateById(id: number): Observable<StudentCertificate> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "id",
      value: id.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.studentCertificatesApiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => {
        const data = res?.data ?? res;
        if (Array.isArray(data)) {
          const certificate = data.find(cert => cert.id === id);
          if (certificate) {
            return certificate;
          }
        }
        throw new Error('Student Certificate not found');
      })
    );
  }

  getCertificatesByStudent(studentId: number): Observable<StudentCertificateWithDetails[]> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "student_id",
      value: studentId.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.studentCertificatesApiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  addStudentCertificate(studentCertificate: StudentCertificate): Observable<StudentCertificate> {
    
    // Clean the data - remove enriched fields that don't exist in the database table
    const cleanData = {
      student_id: studentCertificate.student_id,
      certificate_id: studentCertificate.certificate_id,
      class_id: studentCertificate.class_id === 0 ? null : studentCertificate.class_id,
      issued_date: studentCertificate.issued_date,
      expiry_date: studentCertificate.expiry_date,
      certificate_number: studentCertificate.certificate_number,
      status: studentCertificate.status,
      note: studentCertificate.note,
      issued_by: studentCertificate.issued_by,
      signature: studentCertificate.signature,
      certificate_file_path: studentCertificate.certificate_file_path
    };
    
    
    // Try to save directly first, if it fails due to foreign key, then validate
    return this.http.post<StudentCertificate>(this.studentCertificatesApiUrl, cleanData, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('Direct save failed, trying with validation:', error);
        
        // If it's a foreign key error, try to validate certificate_id first
        if (error.status === 400 || error.status === 500) {
          return this.getCertificateTypeById(studentCertificate.certificate_id).pipe(
            switchMap(() => {
              return this.http.post<StudentCertificate>(this.studentCertificatesApiUrl, cleanData, this.getAuthHeaders());
            }),
            catchError((validationError) => {
              console.error('Certificate type validation failed:', validationError);
              throw validationError;
            })
          );
        }
        
        throw error;
      })
    );
  }

  updateStudentCertificate(id: number, studentCertificate: StudentCertificate): Observable<StudentCertificate> {
    // Clean the data - remove enriched fields that don't exist in the database table
    const cleanData = {
      student_id: studentCertificate.student_id,
      certificate_id: studentCertificate.certificate_id,
      class_id: studentCertificate.class_id === 0 ? null : studentCertificate.class_id,
      issued_date: studentCertificate.issued_date,
      expiry_date: studentCertificate.expiry_date,
      certificate_number: studentCertificate.certificate_number,
      status: studentCertificate.status,
      note: studentCertificate.note,
      issued_by: studentCertificate.issued_by,
      signature: studentCertificate.signature,
      certificate_file_path: studentCertificate.certificate_file_path
    };
    
    // First validate that certificate_id exists
    return this.getCertificateTypeById(studentCertificate.certificate_id).pipe(
      switchMap(() => {
        return this.http.put<StudentCertificate>(`${this.studentCertificatesApiUrl}/${id}`, cleanData, this.getAuthHeaders());
      })
    );
  }

  deleteStudentCertificate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.studentCertificatesApiUrl}/${id}`, this.getAuthHeaders());
  }

  // Get related data for dropdowns
  getStudents(): Observable<any[]> {
    return this.http.get<any>('http://localhost:10093/api/students', this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getClasses(): Observable<any[]> {
    return this.http.get<any>('http://localhost:10093/api/classes', this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getStudentsInClass(classId: number): Observable<any[]> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "class_id",
      value: classId.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    // Sử dụng class_students endpoint để lấy học viên trong lớp
    return this.http.get<any>(`http://localhost:10093/api/class_students?condition=${condition}`, this.getAuthHeaders()).pipe(
      switchMap((res) => {
        const classStudents = res?.data ?? res;
        
        // Handle case where no data is returned
        if (!classStudents || !Array.isArray(classStudents)) {
          return of([]);
        }
        
        // Lấy danh sách student_id từ class_students
        const studentIds = classStudents.map((cs: any) => cs.student_id).filter(id => id);
        
        if (studentIds.length === 0) {
          return of([]);
        }
        
        // Lấy thông tin chi tiết học viên từ API students
        // Tạo multiple conditions với OR cho từng student_id
        const studentConditions = studentIds.map((id, index) => ({
          key: "id",
          value: id.toString(),
          compare: "=",
          orWhere: index === 0 ? "and" : "or"
        }));
        
        const studentCondition = encodeURIComponent(JSON.stringify(studentConditions));
        
        return this.http.get<any>(`http://localhost:10093/api/students?condition=${studentCondition}`, this.getAuthHeaders()).pipe(
          map((studentRes) => {
            const students = studentRes?.data ?? studentRes;
            
            if (!students || !Array.isArray(students)) {
              return [];
            }
            
            // Map student information với thông tin từ class_students
            return students.map((student: any) => {
              return {
                id: student.id,
                student_code: student.student_code || student.code || 'N/A',
                full_name: student.full_name || student.name || 'N/A'
              };
            });
          })
        );
      }),
      catchError((error) => {
        console.error('Error loading students in class:', error);
        // Fallback: return empty array if class_students query fails
        return of([]);
      })
    );
  }

  getCertificateStatistics(filters?: CertificateFilters): Observable<CertificateStatistics> {
    return this.getStudentCertificatesWithDetails(filters).pipe(
      map((certificates) => {
        const totalCertificates = certificates.length;
        const issuedCertificates = certificates.filter(cert => cert.status === 'Đã cấp').length;
        const expiredCertificates = certificates.filter(cert => cert.status === 'Đã hết hạn').length;
        const revokedCertificates = certificates.filter(cert => cert.status === 'Đã thu hồi').length;
        const pendingCertificates = certificates.filter(cert => cert.status === 'Đang chờ').length;

        // Tính số học sinh unique
        const uniqueStudents = new Set(certificates.map(cert => cert.student_id));

        return {
          total_certificates: totalCertificates,
          issued_certificates: issuedCertificates,
          expired_certificates: expiredCertificates,
          revoked_certificates: revokedCertificates,
          pending_certificates: pendingCertificates,
          total_students: uniqueStudents.size
        };
      })
    );
  }

  // Helper methods for dropdowns
  getCertificateStatusOptions(): any[] {
    return [
      { label: 'Đã cấp', value: 'Đã cấp' },
      { label: 'Đã thu hồi', value: 'Đã thu hồi' },
      { label: 'Đã hết hạn', value: 'Đã hết hạn' },
      { label: 'Đang chờ', value: 'Đang chờ' }
    ];
  }

  getCertificateTypes(): any[] {
    return [
      { label: 'Hoạt động', value: 'Hoạt động' },
      { label: 'Tạm dừng', value: 'Tạm dừng' },
      { label: 'Đã hủy', value: 'Đã hủy' }
    ];
  }

  getPermanentOptions(): any[] {
    return [
      { label: 'Có thời hạn', value: 0 },
      { label: 'Vĩnh viễn', value: 1 }
    ];
  }

  // Generate certificate number
  generateCertificateNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CERT-${year}${month}${day}-${random}`;
  }

  // Advanced Certificate Types Management
  getCertificateTypeById(id: number): Observable<Certificate> {
    return this.getCertificateById(id);
  }

  // Auto-calculate expiry date based on certificate type
  calculateExpiryDate(issuedDate: string, certificateTypeId: number): Observable<string | null> {
    return this.getCertificateTypeById(certificateTypeId).pipe(
      map(certType => {
        if (certType.is_permanent === 1) {
          return null; // Permanent certificate, no expiry
        }
        
        if (certType.validity_period_months && certType.validity_period_months > 0) {
          const issued = new Date(issuedDate);
          const expiry = new Date(issued);
          expiry.setMonth(expiry.getMonth() + certType.validity_period_months);
          return expiry.toISOString().split('T')[0];
        }
        
        return null;
      })
    );
  }

  // Validate certificate criteria before issuing
  validateCertificateCriteria(studentId: number, certificateTypeId: number): Observable<{valid: boolean, message: string}> {
    return this.getCertificateTypeById(certificateTypeId).pipe(
      map(certType => {
        if (!certType.criteria || certType.criteria.trim() === '') {
          return { valid: true, message: 'Không có tiêu chí đặc biệt' };
        }
        
        // Here you can add more complex validation logic
        // For now, just return the criteria for manual review
        return { 
          valid: true, 
          message: `Tiêu chí cấp chứng chỉ: ${certType.criteria}` 
        };
      })
    );
  }

  // Get certificate type details for form
  getCertificateTypeDetails(certificateTypeId: number): Observable<{
    isPermanent: boolean,
    validityPeriod: number | null,
    criteria: string,
    status: string
  }> {
    return this.getCertificateTypeById(certificateTypeId).pipe(
      map(certType => ({
        isPermanent: certType.is_permanent === 1,
        validityPeriod: certType.validity_period_months || null,
        criteria: certType.criteria || '',
        status: certType.status || 'Hoạt động'
      }))
    );
  }

  // Check if certificate number already exists
  checkCertificateNumberExists(certificateNumber: string, excludeId?: number): Observable<boolean> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "certificate_number",
      value: certificateNumber,
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.studentCertificatesApiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => {
        const data = res?.data ?? res;
        if (Array.isArray(data)) {
          // If excludeId is provided, filter out the current record
          const filteredData = excludeId ? data.filter((item: any) => item.id !== excludeId) : data;
          return filteredData.length > 0;
        }
        return false;
      })
    );
  }

  // Bulk operations
  bulkUpdateStatus(certificateIds: number[], status: string): Observable<any> {
    return this.http.put<any>(`${this.studentCertificatesApiUrl}/bulk-status`, {
      ids: certificateIds,
      status: status
    }, this.getAuthHeaders());
  }

  bulkDelete(certificateIds: number[]): Observable<any> {
    return this.http.delete<any>(`${this.studentCertificatesApiUrl}/bulk`, {
      ...this.getAuthHeaders(),
      body: { ids: certificateIds }
    });
  }
}
