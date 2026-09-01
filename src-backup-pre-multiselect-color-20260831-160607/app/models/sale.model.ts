import { BaseEntity } from './base.model';

export interface Sale extends BaseEntity {
  salesId: number;
  refOrgId: string | null;
  salesDate: string | null;
  refProductEntryId: string | null;
  currentStock: string | null;
  rfidstatus: string | null;
  description: string | null;
}
