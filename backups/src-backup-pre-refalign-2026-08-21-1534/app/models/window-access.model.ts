import { BaseEntity } from './base.model';

export interface WindowAccess extends BaseEntity {
  windowAccessId: number;
  refOrgId: string | null;
  refRoleId: string | null;
  refWindowId: string | null;
  isCanView: string | null;
  isCanAdd: string | null;
  isCanDelete: string | null;
  isCanEdit: string | null;
  description: string | null;
}
