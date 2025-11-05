import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Fee, FeeWithDetails, FeeFilters, FeeStatistics } from '../models/fees.model';

@Injectable({
  providedIn: 'root'
})
export class FeeService {
  private apiUrl = 'http://localhost:10093/api/fees';

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

  getFees(q?: string): Observable<Fee[]> {
    const url = q && q.trim().length > 0 ? `${this.apiUrl}?q=${encodeURIComponent(q.trim())}` : this.apiUrl;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Get courses for dropdown
  getCourses(): Observable<any[]> {
    return this.http.get<any>('http://localhost:10093/api/courses', this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Get classes for dropdown
  getClasses(): Observable<any[]> {
    return this.http.get<any>('http://localhost:10093/api/classes', this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Get students for dropdown
  getStudents(): Observable<any[]> {
    return this.http.get<any>('http://localhost:10093/api/students', this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getFeesWithDetails(filters?: FeeFilters): Observable<FeeWithDetails[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.student_id) params = params.set('student_id', filters.student_id.toString());
      if (filters.class_id) params = params.set('class_id', filters.class_id.toString());
      if (filters.course_id) params = params.set('course_id', filters.course_id.toString());
      if (filters.payment_type) params = params.set('payment_type', filters.payment_type);
      if (filters.payment_method) params = params.set('payment_method', filters.payment_method);
      if (filters.payment_status) params = params.set('payment_status', filters.payment_status);
      if (filters.due_date_from) params = params.set('due_date_from', filters.due_date_from);
      if (filters.due_date_to) params = params.set('due_date_to', filters.due_date_to);
      if (filters.paid_date_from) params = params.set('paid_date_from', filters.paid_date_from);
      if (filters.paid_date_to) params = params.set('paid_date_to', filters.paid_date_to);
      if (filters.amount_from) params = params.set('amount_from', filters.amount_from.toString());
      if (filters.amount_to) params = params.set('amount_to', filters.amount_to.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getFeeById(id: number): Observable<Fee> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "id",
      value: id.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.apiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => {
        const data = res?.data ?? res;
        if (Array.isArray(data)) {
          const fee = data.find(f => f.id === id);
          if (fee) {
            return fee;
          }
        }
        throw new Error('Fee not found');
      })
    );
  }

  getFeesByStudent(studentId: number): Observable<FeeWithDetails[]> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "student_id",
      value: studentId.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.apiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getFeesByClass(classId: number): Observable<FeeWithDetails[]> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "class_id",
      value: classId.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.apiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getFeeStatistics(filters?: FeeFilters): Observable<FeeStatistics> {
    // Tính toán statistics từ dữ liệu fees có sẵn thay vì gọi endpoint riêng
    return this.getFeesWithDetails(filters).pipe(
      map((fees) => {
        // Helper function to safely parse amount (handle string/number from API)
        const parseAmount = (amount: any): number => {
          if (amount === null || amount === undefined || amount === '') {
            return 0;
          }
          const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
          return typeof numAmount === 'number' && !isNaN(numAmount) && isFinite(numAmount) ? numAmount : 0;
        };

        // Đơn giản hóa - chỉ tính basic tổng và đã trả
        const totalAmount = fees.reduce((sum, fee) => sum + parseAmount(fee.amount), 0);
        
        // Đã trả = có paid_date hoặc payment_status
        const paidAmount = fees
          .filter(fee => fee.paid_date || fee.payment_status === 'Đã thanh toán')
          .reduce((sum, fee) => sum + parseAmount(fee.amount), 0);
        
        // Chưa trả = tổng - đã trả (đơn giản nhất)
        const unpaidAmount = totalAmount - paidAmount;
        
        // Tính số học sinh đơn giản
        const uniqueStudents = new Set(fees.map(fee => fee.student_id));
        const paidStudents = new Set(
          fees
            .filter(fee => fee.paid_date || fee.payment_status === 'Đã thanh toán')
            .map(fee => fee.student_id)
        );
        const unpaidStudents = new Set(
          fees
            .filter(fee => !fee.paid_date && fee.payment_status !== 'Đã thanh toán')
            .map(fee => fee.student_id)
        );

        const statistics = {
          total_amount: totalAmount,
          paid_amount: paidAmount,
          unpaid_amount: unpaidAmount,
          total_students: uniqueStudents.size,
          paid_students: paidStudents.size,
          unpaid_students: unpaidStudents.size
        };

        return statistics;
      })
    );
  }

  getClassFeeStatistics(classId: number): Observable<FeeStatistics> {
    return this.getFeeStatistics({ class_id: classId });
  }

  addFee(fee: Fee): Observable<Fee> {
    return this.http.post<Fee>(this.apiUrl, fee, this.getAuthHeaders());
  }

  updateFee(id: number, fee: Fee): Observable<Fee> {
    return this.http.put<Fee>(`${this.apiUrl}/${id}`, fee, this.getAuthHeaders());
  }

  deleteFee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // Get class fee details for fee-detail component
  getClassFeeDetails(classId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/class/${classId}`, this.getAuthHeaders());
  }

  // Update fee payment details
  updateFeePayment(id: number, paymentData: Partial<Fee>): Observable<Fee> {
    return this.http.patch<Fee>(`${this.apiUrl}/${id}`, paymentData, this.getAuthHeaders());
  }

  markAsPaid(id: number, paidDate: string, receiptNumber?: string, transactionId?: string): Observable<Fee> {
    return this.http.put<Fee>(`${this.apiUrl}/${id}/mark-paid`, {
      paid_date: paidDate,
      receipt_number: receiptNumber,
      transaction_id: transactionId
    }, this.getAuthHeaders());
  }

  markAsUnpaid(id: number): Observable<Fee> {
    return this.http.put<Fee>(`${this.apiUrl}/${id}/mark-unpaid`, {}, this.getAuthHeaders());
  }

  // Helper methods for dropdowns
  getPaymentTypes(): any[] {
    return [
      { label: 'Học phí', value: 'Học phí' },
      { label: 'Phí thi', value: 'Phí thi' },
      { label: 'Phí tài liệu', value: 'Phí tài liệu' },
      { label: 'Phí khác', value: 'Phí khác' }
    ];
  }

  getPaymentMethods(): any[] {
    return [
      { label: 'Tiền mặt', value: 'Tiền mặt' },
      { label: 'Chuyển khoản', value: 'Chuyển khoản' },
      { label: 'Thẻ tín dụng', value: 'Thẻ tín dụng' },
      { label: 'Ví điện tử', value: 'Ví điện tử' }
    ];
  }

  getPaymentStatusOptions(): any[] {
    return [
      { label: 'Chưa thanh toán', value: 'Chưa thanh toán' },
      { label: 'Đã thanh toán', value: 'Đã thanh toán' },
      { label: 'Quá hạn', value: 'Quá hạn' },
      { label: 'Hoàn thành', value: 'Hoàn thành' },
      { label: 'Đã hủy', value: 'Đã hủy' }
    ];
  }
}
