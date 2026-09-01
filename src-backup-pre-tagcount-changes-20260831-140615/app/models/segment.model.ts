import { BaseEntity } from './base.model';

export interface Segment extends BaseEntity {
  segmentId: number;
  refOrgId: string | null;
  segmentName: string | null;
  description: string | null;
}
