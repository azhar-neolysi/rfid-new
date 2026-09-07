import { BaseEntity } from './base.model';

export interface Holding extends BaseEntity {
  holdingId: number;
  refLocationId: string | null;
  name: string | null;
  gstno: string | null;
  pannumber: string | null;
  legalName: string | null;
  address: string | null;
  natureOfBusiness: string | null;
  entityType: string | null;
  registrationType: string | null;
  departmentCodeandType: string | null;
  registrationDate: string | null;
  telePhone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
}
