import { post } from './client';

export interface RegisterCustomerRequest {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
}

export interface RegisterCustomerResponse {
  customerId: string;
  message: string;
}

export const customersApi = {
  register: (body: RegisterCustomerRequest) =>
    post<RegisterCustomerResponse>('/customers/register', body),
};
