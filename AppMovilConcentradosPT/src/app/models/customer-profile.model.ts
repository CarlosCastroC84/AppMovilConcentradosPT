export type AuthProvider = 'COGNITO' | 'GOOGLE';

export interface CustomerProfile {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  municipality: string;
  addressReference?: string;
  authProvider: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCustomerProfileRequest {
  fullName: string;
  phone: string;
  municipality: string;
  addressReference?: string;
}
