import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Service
import { PublicAiService } from './public-ai.service';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp?: Date;
}

@Component({
  selector: 'app-public-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    RippleModule,
    TextareaModule,
    TagModule,
    ScrollPanelModule,
    ProgressSpinnerModule,
    ToastModule,
    RouterModule
  ],
  providers: [MessageService],
  templateUrl: './public-ai-chat.component.html',
  styleUrls: ['./public-ai-chat.component.scss']
})
export class PublicAiChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private aiService: PublicAiService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Add welcome message
    this.messages.push({
      role: 'ai',
      text: 'Xin chào! Tôi là trợ lý AI tư vấn khóa học. Tôi có thể giúp bạn tìm hiểu về các khóa học, học phí, lịch học và đưa ra gợi ý phù hợp. Bạn muốn biết thông tin gì?',
      timestamp: new Date()
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const userMessage = this.currentMessage.trim();
    this.currentMessage = '';

    // Add user message
    this.messages.push({
      role: 'user',
      text: userMessage,
      timestamp: new Date()
    });

    // Scroll to bottom
    this.scrollToBottom();

    // Call AI service
    this.isLoading = true;
    this.aiService.sendMessage(userMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.messages.push({
            role: 'ai',
            text: response.reply,
            timestamp: new Date()
          });
          this.isLoading = false;
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error:', error);
          this.messages.push({
            role: 'ai',
            text: 'Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
            timestamp: new Date()
          });
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: error.message || 'Không thể kết nối với dịch vụ AI'
          });
          this.scrollToBottom();
        }
      });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
