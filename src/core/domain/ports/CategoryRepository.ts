import { SystemCategory } from '../entities/SystemCategory';

export interface CategoryRepository {
  findAll(): Promise<SystemCategory[]>;
  findByName(name: string): Promise<SystemCategory | null>;
  create(name: string, userId?: string): Promise<SystemCategory>;
  update(id: string, name: string, userId?: string): Promise<SystemCategory>;
  delete(id: string, userId?: string): Promise<void>;
}
