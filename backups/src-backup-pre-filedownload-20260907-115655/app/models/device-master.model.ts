import { BaseEntity } from './base.model';

export interface DeviceMaster extends BaseEntity {
  deviceMasterId: number;
  refOrgId: string | null;
  deviceCode: string | null;
  deviceName: string | null;
  deviceType: string | null;
  deviceManufacturer: string | null;
  deviceIpaddress: string | null;
  deviceMacaddress: string | null;
  devicePassword: string | null;
  description: string | null;
  refLocationId: string | null;
  imei: string | null;
  deviceModel: string | null;
  status: string | null;
}
