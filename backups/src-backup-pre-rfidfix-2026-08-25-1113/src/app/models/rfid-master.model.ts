import { BaseEntity } from './base.model';

export interface Rfidmaster extends BaseEntity {
  rfidmasterId: number;
  refOrgId: string | null;
  date: string | null;
  tagId: string | null;
  tagSize: string | null;
  tagModel: string | null;
  tagStatus: string | null;
  frequency: string | null;
  type: string | null;
  style: string | null;
  size: string | null;
  encodingType: string | null;
  sysMemoryId: string | null;
  systemId: string | null;
  userMemoryId: string | null;
  memorySize: string | null;
  isRewritable: string | null;
  isAssigned: string | null;
  descritpion1: string | null;
  descritpion2: string | null;
  descritpion3: string | null;
}
