import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpRequestService {
  public api_url = 'https://apps.int.fsa.fpac.usda.gov/fls/api/svcn';

  constructor(private http: HttpClient) {}

  async get<T>(route: string): Promise<T> {
    const url = `${environment.servicing_url}/${route}`;
    const headers = new HttpHeaders({});
    return lastValueFrom(this.http.get<T>(url, { headers: headers }));
  }

  //TODO: Revisit this
  getWithParams<T>(route: string, headers: HttpHeaders, params: HttpParams) {
    const url = `${environment.servicing_url}/${route}`;
    return this.http.get<T>(url, { params: params, headers: headers });
  }

  async post<T>(route: string, data: any): Promise<T> {
    const url = `${environment.servicing_url}/${route}`;
    return firstValueFrom(this.http.post<T>(url, data));
  }

  async commonGet<T>(route: string): Promise<T> {
    const url = `${environment.common_api_url}/${route}`;
    const headers = new HttpHeaders({});
    return lastValueFrom(this.http.get<T>(url, { headers: headers }));
  }
}
