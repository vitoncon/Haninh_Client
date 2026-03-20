// payment-qr.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SocketService } from '../../../../core/services/socket.service';
import { FeeService } from '../../services/fee.service';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-payment-qr',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './payment-qr.component.html',
  styleUrls: ['./payment-qr.component.scss'],
  providers: [MessageService] // Local message service for popup info
})
export class PaymentQrComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() feeId: number = 0;
  @Input() amount: number = 0;
  @Input() studentName: string = '';
  @Input() className: string = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() paymentSuccess = new EventEmitter<number>(); // Emits feeId

  paymentContent: string = '';
  qrImageUrl: string = '';
  isPaid: boolean = false;
  isLoadingPayment: boolean = false;

  countdownMinutes: number = 10;
  countdownSeconds: number = 0;
  private intervalId: any;
  private socketSub!: Subscription;

  constructor(
    private socketService: SocketService,
    private feeService: FeeService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    if (this.visible && this.feeId) {
      this.initPayment();
    }
  }

  ngOnChanges(changes: any): void {
    if (changes['visible'] && changes['visible'].currentValue === true) {
      if (this.feeId) {
        this.initPayment();
      }
    }
  }

  initPayment(): void {
    // Generate payment content: "FEE_{ID}"
    this.paymentContent = `FEE_${this.feeId}`;
    this.isPaid = false;
    this.isLoadingPayment = false;

    // In a real scenario, you would fetch VietQR dynamic image URL from VietQR API here
    // For production simulation, we use a placeholder QR generated for demonstration
    this.qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_BANK_TRANSFER_${this.paymentContent}_AMOUNT_${this.amount}`;

    this.startCountdown();

    // Listen for realtime socket updates
    this.socketSub = this.socketService.onPaymentUpdated().subscribe((data) => {
      if (data.feeId === this.feeId && data.status === 'PAID') {
        this.handlePaymentSuccess();
      }
    });
  }

  startCountdown(): void {
    this.clearInterval();
    this.countdownMinutes = 10;
    this.countdownSeconds = 0;

    this.intervalId = setInterval(() => {
      if (this.countdownSeconds === 0) {
        if (this.countdownMinutes === 0) {
          this.clearInterval();
          // Token expired handling can go here
          return;
        }
        this.countdownMinutes--;
        this.countdownSeconds = 59;
      } else {
        this.countdownSeconds--;
      }
    }, 1000);
  }

  onDialogShow() {
    setTimeout(() => {
      const content = document.querySelector('.p-dialog-content');
      if (content) {
        content.scrollTop = 0;
      }
    });
  }

  clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  formatTime(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  copyContent(): void {
    navigator.clipboard.writeText(this.paymentContent).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Đã copy', detail: 'Đã sao chép nội dung chuyển khoản' });
    });
  }

  simulateTransfer(): void {
    if (this.isPaid || this.countdownMinutes === 0 && this.countdownSeconds === 0) {
      return;
    }

    this.isLoadingPayment = true;

    // Call the fake webhook directly to simulate external banking system hitting the server
    this.feeService.simulateWebhookPayment(this.paymentContent, this.amount).subscribe({
      next: (res) => {
        // We do NOT call handlePaymentSuccess directly! 
        // We wait for the socket.io event to prove realtime is working
      },
      error: (err) => {
        console.error('Lỗi khi giả lập chuyển khoản', err);
        this.isLoadingPayment = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Giả lập thanh toán thất bại' });
      }
    });
  }

  handlePaymentSuccess(): void {
    this.isPaid = true;
    this.isLoadingPayment = false;
    this.clearInterval();

    // Emit success upward to parent compoonent after viewing the success checkmark for 2s
    setTimeout(() => {
      this.paymentSuccess.emit(this.feeId);
      this.closeDialog();
    }, 2000);
  }

  closeDialog(): void {
    this.clearInterval();
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  ngOnDestroy(): void {
    this.clearInterval();
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }
}
