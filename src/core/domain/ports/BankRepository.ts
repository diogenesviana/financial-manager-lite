import { SystemBank } from '../entities/SystemBank';

export interface BankRepository {
  findAll(): Promise<SystemBank[]>;
  findByName(name: string): Promise<SystemBank | null>;
  create(name: string, userId?: string): Promise<SystemBank>;
  update(id: string, name: string, userId?: string): Promise<SystemBank>;
  delete(id: string, userId?: string): Promise<void>;
}
