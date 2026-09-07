import { BaseEntity } from './base.model';

export interface Employee extends BaseEntity {
  employeeId: number;
  refOrgId: string | null;
  refLocationId: string | null;
  refRoleId: string | null;
  value: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dob: string | null;
  doj: string | null;
  email: string | null;
  mobileNo: string | null;
  empStatus: string | null;
  noticePeriod: string | null;
  nationality: string | null;
}
