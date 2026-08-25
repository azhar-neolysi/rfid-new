import { BaseEntity } from './base.model';

export interface Reference extends BaseEntity {
  referenceId: number;
  name: string | null;
  description: string | null;
  refOrgId: string | null;
}
