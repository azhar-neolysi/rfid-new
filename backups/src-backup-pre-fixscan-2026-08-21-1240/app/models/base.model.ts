export interface BaseEntity {
  isActive: string | null;
  isDeleted: string | null;
  refCreatedBy: string | null;
  createdDate: string | null;
  refModifiedBy: string | null;
  modifiedDate: string | null;
}
