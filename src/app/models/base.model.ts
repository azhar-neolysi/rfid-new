export interface BaseEntity {
  isActive: boolean | null;
  isDeleted: boolean | null;
  refCreatedBy: string | null;
  createdDate: string | null;
  refModifiedBy: string | null;
  modifiedDate: string | null;
}
