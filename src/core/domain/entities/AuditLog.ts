export interface AuditLog {
  id: string;
  modelName: string;
  recordId: string;
  action: string;
  oldData?: any;
  newData?: any;
  userId?: string | null;
  createdAt: Date;
  user?: {
    name: string;
    email: string;
  } | null;
}
