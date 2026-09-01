import { BaseEntity } from './base.model';

export interface Role extends BaseEntity {
  roleId: number;
  refOrgId: string | null;
  roleName: string | null;
  description: string | null;
}
