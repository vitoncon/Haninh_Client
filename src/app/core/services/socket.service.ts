import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any;

  constructor() {
    // Determine backend URL to connect socket
    const serverUrl = 'http://localhost:10094';
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'] 
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket Server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket Server');
    });
  }

  // Listen to payment updates
  onPaymentUpdated(): Observable<{ feeId: number, status: string }> {
    return new Observable((observer) => {
      this.socket.on('payment-updated', (data: any) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('payment-updated');
      };
    });
  }

  // Listen to new lead registration
  onNewLead(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('new-lead', (data: any) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('new-lead');
      };
    });
  }
}
