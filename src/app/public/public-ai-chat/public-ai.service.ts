import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface PublicChatRequest {
  message: string;
}

export interface PublicChatResponse {
  reply: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicAiService {
  private readonly apiUrl = 'http://localhost:10093/api/ai/public-chat';
  
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Send message to public AI chat endpoint
   * @param message - User message
   * @returns Observable with AI response
   */
  sendMessage(message: string): Observable<PublicChatResponse> {
    const body: PublicChatRequest = { message };
    
    return this.http.post<PublicChatResponse>(this.apiUrl, body, this.httpOptions).pipe(
      catchError((error) => {
        console.error('Error calling AI service:', error);
        return throwError(() => new Error('Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.'));
      })
    );
  }
}
