import { BaseEntity } from './base.model';

export interface SegmentReferenceListMapping extends BaseEntity {
  segmentReferenceListMappingId: number;
  refOrgid: string | null;
  refSegmentId: string | null;
  refReferenceListId: string | null;
}
