import { BaseEntity } from './base.model';

export interface ProductEntryReferenceListMapping extends BaseEntity {
  productEntryReferenceListMappingId: number;
  refOrgid: string | null;
  refProductEntryId: string | null;
  refReferenceListId: string | null;
}
