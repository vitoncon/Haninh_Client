import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeeService } from '../../services/fee.service';
import { FeeWithDetails } from '../../models/fees.model';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { StudentService } from '../../services/student.service';
import { DialogModule } from 'primeng/dialog';
import { getDisplayStatus, getDisplaySeverity, normalizeStatus } from '../../../../shared/utils/payment-utils';
import { PaymentQrComponent } from '../payment-qr/payment-qr.component';
import { SocketService } from '../../../../core/services/socket.service';

@Component({
  selector: 'app-student-fees',
  templateUrl: './student-fees.html',
  styleUrls: ['./student-fees.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ProgressSpinnerModule,
    RippleModule,
    DialogModule,
    PaymentQrComponent
  ],
  providers: [MessageService]
})
export class StudentFees implements OnInit, OnDestroy {
  fees: FeeWithDetails[] = [];
  loading: boolean = false;
  submitting: boolean = false;
  studentId: number | null = null;
  
  // Bank Information (Placeholders as requested)
  bankInfo = {
    name: 'Vietcombank',
    accountNumber: '123456789',
    accountHolder: 'NGUYEN VAN A'
  };

  // QR Payment Modal State
  qrPaymentDialogVisible: boolean = false;
  selectedQrFeeId: number = 0;
  selectedQrAmount: number = 0;
  selectedQrStudentName: string = '';
  selectedQrClassName: string = '';

  // Export utility functions for template
  getDisplayStatus = getDisplayStatus;
  getDisplaySeverity = getDisplaySeverity;
  normalizeStatus = normalizeStatus;

  private destroy$ = new Subject<void>();

  constructor(
    private feeService: FeeService,
    private studentService: StudentService,
    private messageService: MessageService,
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.extractStudentId();
    this.loadFees();

    // Listen for realtime socket updates to auto-refresh fees
    this.socketService.onPaymentUpdated().pipe(
      takeUntil(this.destroy$)
    ).subscribe((data) => {
      // If any fee gets PAID via external Webhook, reload list
      if (data.status === 'PAID') {
        this.loadFees();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extractStudentId(): void {
    const token = this.authService.getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.studentId = payload.id; 
      } catch (e) {
        console.error('Error parsing token', e);
      }
    }
  }

  loadFees(): void {
    this.loading = true;
    this.studentService.getMyFees().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.fees = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading fees', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin học phí'
        });
        this.loading = false;
      }
    });
  }

  onOpenQrPayment(fee: FeeWithDetails): void {
     if (!fee.id) return;
     this.selectedQrFeeId = fee.id;
     
     // Determine amount
     const parsedAmount = typeof fee.amount === 'string' ? parseFloat(fee.amount) : fee.amount;
     this.selectedQrAmount = parsedAmount;
     
     // Determine student name and class name
     this.selectedQrStudentName = fee.student_name || 'N/A';
     this.selectedQrClassName = fee.class_name || 'N/A';

     this.qrPaymentDialogVisible = true;
  }

  onQrPaymentSuccess(feeId: number): void {
     this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Học phí của bạn đã được thanh toán thông qua App ngân hàng!'
    });
    // the ngOnInit socket listener will automatically catch the emit and refresh the list, 
    // but just in case we can call loadFees directly
    this.loadFees();
  }

  getStatusSeverity(status: any): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    const s = typeof status === 'string' ? status : status?.status;

    switch (s) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warn';
      case 'UNPAID':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'UNPAID':
        return 'Chưa thanh toán';
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'PAID':
        return 'Đã thanh toán';
      default:
        return status;
    }
  }

  getStatusLabel(fee: FeeWithDetails): string {
    return getDisplayStatus(fee);
  }

  formatCurrency(amount: any): string {
    if (amount === null || amount === undefined) return '0 ₫';
    
    const val = typeof amount === 'string' 
      ? parseFloat(amount.replace(/,/g, '')) 
      : (typeof amount === 'number' ? amount : 0);

    if (isNaN(val)) return '0 ₫';

    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(val);
  }

  onDownloadInvoice(fee: FeeWithDetails): void {
    if (!fee.id) return;
    
    this.loading = true;
    this.studentService.getFeeInvoice(fee.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Hoa_Don_Hoc_Phi_${fee.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã tải hóa đơn thành công'
        });
      },
      error: (error) => {
        console.error('Error downloading invoice', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải hóa đơn'
        });
        this.loading = false;
      }
    });
  }
}

