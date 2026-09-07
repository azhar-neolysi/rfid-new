import { BaseEntity } from './base.model';

export interface EmpUserMapping extends BaseEntity {
  empUserMappingId: number;
  refOrgid: string | null;
  refEmpId: string | null;
  refUserId: string | null;
}
