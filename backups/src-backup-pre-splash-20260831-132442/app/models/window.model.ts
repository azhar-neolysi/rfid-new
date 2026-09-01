import { BaseEntity } from './base.model';

export interface Window extends BaseEntity {
  windowId: number;
  refOrgid: string | null;
  windowName: string | null;
  help: string | null;
  isReadOnly: string | null;
}
