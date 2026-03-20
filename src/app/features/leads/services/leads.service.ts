import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Lead } from '../models/leads.model';

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private apiUrl = '/api/leads';

  constructor(private http: HttpClient) {}

  getLeads(): Observable<Lead[]> {
    return this.http.get<{data: Lead[]}>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  updateLeadStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { status });
  }

  deleteLead(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/destroy/${id}`);
  }
}
