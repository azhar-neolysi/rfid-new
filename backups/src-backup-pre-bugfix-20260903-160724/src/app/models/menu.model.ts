import { BaseEntity } from './base.model';

export interface Menu extends BaseEntity {
  menuId: number;
  refOrgid: string | null;
  refWindowId: string | null;
  menuName: string | null;
  description: string | null;
}
