import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  Validator,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { RfidService } from '../rfid.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { HardwareRfidService } from '../../services/hardware-rfid.service';
@Component({
  selector: 'app-rfid-master',
  templateUrl: './rfid-master.page.html',
  styleUrls: ['./rfid-master.page.scss'],
})
export class RfidMasterPage implements OnInit, OnDestroy {
  data: any[] = [];
  excelUpload = false;
  readerConnected = false;
  pageActive = false;
  private subs: Subscription[] = [];
  rfidForm = this.formBuilder.group({
    rfidmasterId: [],
    refOrgId: [null],
    createdDate: [new Date()],
    refCreatedBy: [null],
    modifiedDate: [null],
    refModifiedBy: [null],
    isActive: [true],
    isDeleted: [false],
    date: [''],
    tagID: ['', [Validators.required]],
    tagSize: ['', [Validators.required]],
    tagModel: ['', [Validators.required]],
    tagStatus: ['', [Validators.required]],
    frequency: ['', [Validators.required]],
    type: ['', [Validators.required]],
    style: ['', [Validators.required]],
    size: ['', [Validators.required]],
    encodingType: ['', [Validators.required]],
    sysMemoryId: ['', [Validators.required]],
    systemId: ['', [Validators.required]],
    userMemoryId: ['', [Validators.required]],
    memorySize: ['', [Validators.required]],
    isRewritable: [true],
    isAssigned: [false],
    descritpion1: [''],
    descritpion2: [''],
    descritpion3: [''],
  });
  excelData: any = [];
  rfid_Id: any;
  rfidData: any = [];
  maxDate: string;
  scanLocked = false;
  readingDetails = false;
  private existingByTag = new Map<string, any>();
  private currentScanEpc: string | null = null;
  constructor(
    private formBuilder: FormBuilder,
    private rfid: RfidService,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private toast: ToastController,
    private hardwareRfid: HardwareRfidService
  ) {
    this.maxDate = new Date().toISOString().split('T')[0];
    this.rfidForm.controls.date.setValue(this.maxDate)
  }

  ngOnInit() {
    this.readerConnected = this.hardwareRfid.isConnected;
    this.subs.push(
      this.hardwareRfid.connected$.subscribe(() => { this.readerConnected = true; }),
      this.hardwareRfid.disconnected$.subscribe(() => { this.readerConnected = false; }),
      this.hardwareRfid.tagRead$.subscribe((event) => {
        if (!this.pageActive) return;
        this.onTagScanned(event.epc);
      })
    );
    this.loadExistingTags();
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.rfid_Id = param['id'];
      if (this.rfid_Id) {
        this.getRFIDById();
        return;
      }
      const pendingTag = this.route.snapshot.queryParamMap.get('tagId');
      if (pendingTag) {
        this.prefillFromTag(pendingTag);
      }
    });
  }
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
  ionViewDidEnter() {
    this.pageActive = true;
    this.hardwareRfid
      .ensureConnected()
      .then(() => this.hardwareRfid.startTriggerScan())
      .catch(() => {});
  }
  ionViewDidLeave() {
    this.pageActive = false;
    this.hardwareRfid.stopTriggerScan().catch(() => {});
  }
  loadExistingTags() {
    this.rfid.getRFIDs().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : [];
        this.existingByTag.clear();
        list.forEach((item: any) => {
          if (item && item.tagId) {
            this.existingByTag.set(String(item.tagId).toUpperCase(), item);
          }
        });
      },
      error: () => { },
    });
  }
  onTagScanned(epc: string) {
    if (!epc) return;
    const epcKey = epc.toUpperCase();
    this.currentScanEpc = epc;
    this.rfidForm.controls.tagID.setValue(epc);
    this.rfidForm.controls.encodingType.setValue(decodeEpcHeader(epc));
    const existing = this.existingByTag.get(epcKey);
    if (existing) {
      this.readingDetails = false;
      this.scanLocked = false;
      this.rfid_Id = existing.rfidmasterId;
      this.populateFromRecord(existing);
      this.showDuplicateToast(existing);
      return;
    }

    this.rfid_Id = null;
    this.scanLocked = true;
    this.rfidForm.controls.systemId.setValue('');
    this.rfidForm.controls.sysMemoryId.setValue('');
    this.rfidForm.controls.userMemoryId.setValue('');
    this.rfidForm.controls.memorySize.setValue('');
    this.readTagMemoryDetails(epc);
  }
  private prefillFromTag(tag: string) {
    this.rfid_Id = null;
    this.scanLocked = false;
    this.readingDetails = false;
    this.currentScanEpc = tag;
    this.rfidForm.controls.tagID.setValue(tag);
    this.rfidForm.controls.encodingType.setValue(decodeEpcHeader(tag));
    this.rfidForm.controls.systemId.setValue('');
    this.rfidForm.controls.sysMemoryId.setValue('');
    this.rfidForm.controls.userMemoryId.setValue('');
    this.rfidForm.controls.memorySize.setValue('');
  }
  private readTagMemoryBusy = false;
  /**
   * Reads TID + USER banks for a freshly scanned tag while inventory is
   * briefly stopped, then always resumes scanning. Runs entirely from the
   * frontend so the native hot path stays untouched and inventory state
   * can self-heal even if it died silently earlier.
   */
  private async readTagMemoryDetails(epc: string) {
    if (this.readTagMemoryBusy) return;
    this.readTagMemoryBusy = true;
    this.readingDetails = true;
    try {
      await this.hardwareRfid.forceStopInventory();
      const tidRes = await this.hardwareRfid
        .readMemory({ epc, bank: 'TID', offset: 0, count: 8 })
        .catch(() => null);
      const userRes = await this.hardwareRfid
        .readMemory({ epc, bank: 'USER', offset: 0, count: 32 })
        .catch(() => null);
      if (this.currentScanEpc !== epc) return;
      if (tidRes && tidRes.data) {
        this.rfidForm.controls.systemId.setValue(tidRes.data);
        this.rfidForm.controls.sysMemoryId.setValue(tidChipFamily(tidRes.data));
      }
      if (userRes && userRes.data) {
        this.rfidForm.controls.userMemoryId.setValue(userRes.data);
        const words = Math.floor(userRes.data.length / 4);
        if (words > 0) {
          this.rfidForm.controls.memorySize.setValue(`${words * 16} bits`);
        }
      }
    } catch (err) {
      console.error('[RFIDMaster] memory enrichment failed:', err);
    } finally {
      this.hardwareRfid.startTriggerScan().catch(() => { });
      this.readingDetails = false;
      this.readTagMemoryBusy = false;
    }
  }
  async showToast(color: string, message: string) {
    const t = await this.toast.create({
      color,
      message,
      position: 'top',
      duration: 2000,
    });
    t.present();
  }
  async showDuplicateToast(record: any) {
    await this.showToast('warning', 'Tag already exists â€” loaded for editing');
  }
  excelUploadEnable() {
    this.excelUpload = !this.excelUpload ? true : false;
  }
  getRFIDById() {
    this.rfid.getRFID(this.rfid_Id).subscribe({
      next: (res: any) => {
        this.scanLocked = false;
        this.readingDetails = false;
        this.populateFromRecord(res);
      },
      error: () => {
        this.showToast('danger', 'Failed to load RFID tag');
        this.scanLocked = false;
        this.readingDetails = false;
      },
    });
  }
  populateFromRecord(rfidData: any) {
    if (!rfidData) return;
    this.rfidData = rfidData;
    this.rfidForm.controls.createdDate.setValue(this.rfidData.createdDate);
    this.rfidForm.controls.date.setValue(
      this.datePipe.transform(this.rfidData.date, 'yyyy-MM-dd')
    );
    this.rfidForm.controls.descritpion1.setValue(this.rfidData.descritpion1);
    this.rfidForm.controls.descritpion2.setValue(this.rfidData.descritpion2);
    this.rfidForm.controls.descritpion3.setValue(this.rfidData.descritpion3);
    this.rfidForm.controls.encodingType.setValue(this.rfidData.encodingType);
    this.rfidForm.controls.frequency.setValue(this.rfidData.frequency);
    this.rfidForm.controls.isActive.setValue(this.rfidData.isActive);
    this.rfidForm.controls.isDeleted.setValue(this.rfidData.isDeleted);
    this.rfidForm.controls.isAssigned.setValue(this.rfidData.isAssigned);
    this.rfidForm.controls.isRewritable.setValue(this.rfidData.isRewritable);
    this.rfidForm.controls.memorySize.setValue(this.rfidData.memorySize);
    this.rfidForm.controls.modifiedDate.setValue(this.rfidData.modifiedDate);
    this.rfidForm.controls.refCreatedBy.setValue(this.rfidData.refCreatedBy);
    this.rfidForm.controls.refModifiedBy.setValue(
      this.rfidData.refModifiedBy
    );
    this.rfidForm.controls.refOrgId.setValue(this.rfidData.refOrgId);
    this.rfidForm.controls.size.setValue(this.rfidData.size);
    this.rfidForm.controls.style.setValue(this.rfidData.style);
    this.rfidForm.controls.sysMemoryId.setValue(this.rfidData.sysMemoryId);
    this.rfidForm.controls.systemId.setValue(this.rfidData.systemId);
    this.rfidForm.controls.tagID.setValue(this.rfidData.tagId);
    this.rfidForm.controls.tagModel.setValue(this.rfidData.tagModel);
    this.rfidForm.controls.tagSize.setValue(this.rfidData.tagSize);
    this.rfidForm.controls.tagStatus.setValue(this.rfidData.tagStatus);
    this.rfidForm.controls.type.setValue(this.rfidData.type);
    this.rfidForm.controls.userMemoryId.setValue(this.rfidData.userMemoryId);
    this.rfidForm.controls.rfidmasterId.setValue(this.rfidData.rfidmasterId);
  }
  onFileSelected(event: any) {
    this.excelData = [];
    const file: any = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    fileReader.onload = (e) => {
      var workbook = XLSX.read(fileReader.result, { type: 'binary' });
      var sheetNames = workbook.SheetNames;
      this.excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
    };
  }
  upload() {
    this.excelData.forEach((element: any) => {
      // this.referenceForm.controls.refName.setValue(res.name);
      this.rfidForm.controls.createdDate.setValue(new Date());
      this.rfidForm.controls.date.setValue(element.Date);
      this.rfidForm.controls.descritpion1.setValue(element.Descritpion1);
      this.rfidForm.controls.descritpion2.setValue(element.Descritpion2);
      this.rfidForm.controls.descritpion3.setValue(element.Descritpion3);
      this.rfidForm.controls.encodingType.setValue(element.EncodingType);
      this.rfidForm.controls.frequency.setValue(element.Frequency);
      this.rfidForm.controls.isActive.setValue(true);
      this.rfidForm.controls.isDeleted.setValue(false);
      this.rfidForm.controls.isAssigned.setValue(element.isAssigned === 1 ? true : false);
      this.rfidForm.controls.isRewritable.setValue(element.isRewritable === 1 ? true : false);
      this.rfidForm.controls.memorySize.setValue(element.MemorySize);
      this.rfidForm.controls.modifiedDate.setValue(null);
      this.rfidForm.controls.refCreatedBy.setValue(null);
      this.rfidForm.controls.refModifiedBy.setValue(null);
      this.rfidForm.controls.refOrgId.setValue(null);
      this.rfidForm.controls.size.setValue(String(element.Size));
      this.rfidForm.controls.style.setValue(element.Style);
      this.rfidForm.controls.sysMemoryId.setValue(String(element.SysMemoryId));
      this.rfidForm.controls.systemId.setValue(String(element.SystemId));
      this.rfidForm.controls.tagID.setValue(String(element.TagID));
      this.rfidForm.controls.tagModel.setValue(element.TagModel);
      this.rfidForm.controls.tagSize.setValue(String(element.TagSize));
      this.rfidForm.controls.tagStatus.setValue(element.TagStatus);
      this.rfidForm.controls.type.setValue(element.Type);
      this.rfidForm.controls.userMemoryId.setValue(
        String(element.UserMemoryId)
      );
      this.addRFID();
    });
  }
  addRFID() {
    if ((this, this.rfidForm.valid)) {
      if (this.rfid_Id) {
        const data = {
          rfidmasterId: this.rfidForm.value.rfidmasterId,
          refOrgId: this.rfidForm.value.refOrgId,
          createdDate: this.rfidForm.value.createdDate,
          refCreatedBy: this.rfidForm.value.refCreatedBy,
          modifiedDate: this.rfidForm.value.modifiedDate,
          refModifiedBy: this.rfidForm.value.refModifiedBy,
          isActive: this.rfidForm.value.isActive,
          isDeleted: this.rfidForm.value.isDeleted,
          date: this.rfidForm.value.date,
          tagId: this.rfidForm.value.tagID,
          tagSize: this.rfidForm.value.tagSize,
          tagModel: this.rfidForm.value.tagModel,
          tagStatus: this.rfidForm.value.tagStatus,
          frequency: this.rfidForm.value.frequency,
          type: this.rfidForm.value.type,
          style: this.rfidForm.value.style,
          size: this.rfidForm.value.size,
          encodingType: this.rfidForm.value.encodingType,
          sysMemoryId: this.rfidForm.value.sysMemoryId,
          systemId: this.rfidForm.value.systemId,
          userMemoryId: this.rfidForm.value.userMemoryId,
          memorySize: this.rfidForm.value.memorySize,
          isRewritable: this.rfidForm.value.isRewritable,
          isAssigned: this.rfidForm.value.isAssigned,
          descritpion1: this.rfidForm.value.descritpion1,
          descritpion2: this.rfidForm.value.descritpion2,
          descritpion3: this.rfidForm.value.descritpion3,
        };
        this.rfid.updateRFID(data).subscribe({
          next: () => {
            this.showToast('success', 'Record Saved Successfully');
            this.router.navigate(['rfid-list']);
          },
          error: () => {
            this.showToast('danger', 'Failed to save RFID tag');
          },
        });
      } else {
        const data = {
          refOrgId: this.rfidForm.value.refOrgId,
          createdDate: this.rfidForm.value.createdDate,
          refCreatedBy: this.rfidForm.value.refCreatedBy,
          modifiedDate: this.rfidForm.value.modifiedDate,
          refModifiedBy: this.rfidForm.value.refModifiedBy,
          isActive: this.rfidForm.value.isActive,
          isDeleted: this.rfidForm.value.isDeleted,
          date: this.rfidForm.value.date,
          tagId: this.rfidForm.value.tagID,
          tagSize: this.rfidForm.value.tagSize,
          tagModel: this.rfidForm.value.tagModel,
          tagStatus: this.rfidForm.value.tagStatus,
          frequency: this.rfidForm.value.frequency,
          type: this.rfidForm.value.type,
          style: this.rfidForm.value.style,
          size: this.rfidForm.value.size,
          encodingType: this.rfidForm.value.encodingType,
          sysMemoryId: this.rfidForm.value.sysMemoryId,
          systemId: this.rfidForm.value.systemId,
          userMemoryId: this.rfidForm.value.userMemoryId,
          memorySize: this.rfidForm.value.memorySize,
          isRewritable: this.rfidForm.value.isRewritable,
          isAssigned: this.rfidForm.value.isAssigned,
          // isRewritable: this.rfidForm.value.isRewritable === 1 ? true : false,
          // isAssigned: this.rfidForm.value.isAssigned === 1 ? true : false,
          descritpion1: this.rfidForm.value.descritpion1,
          descritpion2: this.rfidForm.value.descritpion2,
          descritpion3: this.rfidForm.value.descritpion3,
        };
        this.rfid.addRFID(data).subscribe({
          next: () => {
            this.showToast('success', 'Record Saved Successfully');
            this.router.navigate(['rfid-list']);
          },
          error: () => {
            this.showToast('danger', 'Failed to save RFID tag');
          },
        });
      }
    } else {
      console.log(this, this.rfidForm.valid);
      return;
    }
  }
}

const EPC_HEADER_NAMES: { [header: string]: string } = {
  '30': 'SGTIN-96',
  '31': 'SGTIN-198',
  '32': 'SSCC-96',
  '33': 'SSCC-198',
  '34': 'GID-96',
  '35': 'GID-198',
  '36': 'SGLN-96',
  '37': 'SGLN-198',
  '38': 'GRAI-96',
  '39': 'GRAI-198',
  '3A': 'GIAI-96',
  '3B': 'GIAI-198',
};

function decodeEpcHeader(epc: string): string {
  if (!epc || epc.length < 2) return '';
  const header = epc.substring(0, 2).toUpperCase();
  return EPC_HEADER_NAMES[header] || 'Custom';
}

const TID_CHIP_FAMILIES: { [prefix: string]: string } = {
  E280: 'Impinj Monza',
  E281: 'Impinj M700',
  E282: 'Impinj M800',
  E284: 'Impinj M900',
  E204: 'NXP UCODE',
  E200: 'Alien Higgs',
  E213: 'EM Micro',
  E215: 'Fudan',
  A800: 'Quanray',
};

function tidChipFamily(tid: string): string {
  if (!tid || tid.length < 4) return '';
  const prefix = tid.substring(0, 4).toUpperCase();
  return TID_CHIP_FAMILIES[prefix] || `TID ${prefix}`;
}
