import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Subject, takeUntil } from 'rxjs';
import { LeadsService } from '../../services/leads.service';
import { Lead, LeadStatistics } from '../../models/leads.model';
import { vi } from '../../../../config/translation-vi';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    InputTextModule,
    SelectModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
    TooltipModule,
    ConfirmDialogModule,
    DatePipe
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './leads.html',
  styleUrls: ['./leads.scss']
})
export class LeadsComponent implements OnInit, OnDestroy {
  leads: Lead[] = [];
  filteredLeads: Lead[] = [];
  loading: boolean = false;
  searchQuery: string = '';
  showClearButton: boolean = false;
  vi = vi;
  
  statistics: LeadStatistics = {
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
    rejected: 0
  };

  statusOptions = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Mới', value: 'new' },
    { label: 'Đã liên hệ', value: 'contacted' },
    { label: 'Đã chuyển đổi', value: 'converted' },
    { label: 'Hủy/Từ chối', value: 'rejected' }
  ];
  selectedStatusFilter: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private leadsService: LeadsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.leadsService.getLeads().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        // Parse dates and sort correctly
        this.leads = (data || []).map(lead => ({
          ...lead,
          created_at: new Date(lead.created_at).toISOString()
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        this.calculateStatistics();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách khách hàng tiềm năng' });
        this.loading = false;
      }
    });
  }

  calculateStatistics(): void {
    const stats = { total: 0, new: 0, contacted: 0, converted: 0, rejected: 0 };
    stats.total = this.leads.length;
    this.leads.forEach(lead => {
      if (lead.status === 'new') stats.new++;
      else if (lead.status === 'contacted') stats.contacted++;
      else if (lead.status === 'converted') stats.converted++;
      else if (lead.status === 'rejected') stats.rejected++;
    });
    this.statistics = stats;
  }

  onSearch(event: any): void {
    this.searchQuery = event.target?.value || '';
    this.showClearButton = this.searchQuery.length > 0;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.showClearButton = false;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.leads];
    
    // Status filter
    if (this.selectedStatusFilter) {
      filtered = filtered.filter(l => l.status === this.selectedStatusFilter);
    }
    
    // Text search
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(l => 
        (l.fullname && l.fullname.toLowerCase().includes(query)) ||
        (l.phone && l.phone.includes(query)) ||
        (l.email && l.email.toLowerCase().includes(query)) ||
        (l.course_name && l.course_name.toLowerCase().includes(query)) ||
        (l.message && l.message.toLowerCase().includes(query))
      );
    }
    
    this.filteredLeads = filtered;
  }

  updateStatus(lead: Lead, newStatus: string): void {
    this.leadsService.updateLeadStatus(lead.id, newStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        lead.status = newStatus as any;
        this.calculateStatistics();
        this.applyFilters();
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật trạng thái thành công' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể cập nhật trạng thái' });
      }
    });
  }

  deleteLead(lead: Lead): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa khách hàng "${lead.fullname}"? Dữ liệu không thể khôi phục.`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.leadsService.deleteLead(lead.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.leads = this.leads.filter(l => l.id !== lead.id);
            this.calculateStatistics();
            this.applyFilters();
            this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa khách hàng' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa dữ liệu' });
          }
        });
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'new': return 'info';
      case 'contacted': return 'warn';
      case 'converted': return 'success';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'new': return 'Mới';
      case 'contacted': return 'Đã liên hệ';
      case 'converted': return 'Đã chuyển đổi';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  }
}
