import { BaseEntity } from './base.model';

export interface TrialRoomProductEntryMapping extends BaseEntity {
  trialRoomProductEntryMappingId: number;
  refOrgid: string | null;
  refTrialRoomId: string | null;
  refProductEntryId: string | null;
}
