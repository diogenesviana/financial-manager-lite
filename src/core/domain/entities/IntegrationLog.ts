export interface IntegrationLog {
  id: string;
  serviceName: string;
  operation: string;
  status: 'SUCCESS' | 'ERROR';
  requestData?: any;
  responseData?: any;
  errorMessage?: string | null;
  durationMs: number;
  userId?: string | null;
  createdAt: Date;
  user?: {
    name: string;
    email: string;
  } | null;
}
