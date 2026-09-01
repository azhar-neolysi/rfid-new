import { BaseEntity } from './base.model';

export interface Location extends BaseEntity {
  locationId: number;
  refReferenceListCityId: string | null;
  refReferenceListStateId: string | null;
  refReferenceListCountryId: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  pin: string | null;
}
