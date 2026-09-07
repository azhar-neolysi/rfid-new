import { BaseEntity } from './base.model';

export interface ReferenceList extends BaseEntity {
  referenceListId: number;
  refOrgId: string | null;
  refReferenceId: string | null;
  name: string | null;
  description: string | null;
  description1: string | null;
  description2: string | null;
  description3: string | null;
  description4: string | null;
  description5: string | null;
}
