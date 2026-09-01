import { BaseEntity } from './base.model';

export interface TrialRoom extends BaseEntity {
  trialRoomId: number;
  refOrgId: string | null;
  trailRoomName: string | null;
  description: string | null;
}
