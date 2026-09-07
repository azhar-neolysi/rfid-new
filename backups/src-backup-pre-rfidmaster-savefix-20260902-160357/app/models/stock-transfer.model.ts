import { BaseEntity } from './base.model';

export interface StockTransfer extends BaseEntity {
  stockTransferId: number;
  refOrgId: string | null;
  date: string | null;
  refProductEntryId: string | null;
  qty: string | null;
  refRefListSourcePoint: string | null;
  refRefListDestinationPoint: string | null;
  approvedBy: string | null;
  reason: string | null;
}
