import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { SegmentService } from '../segment.service';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
import * as XLSX from 'xlsx';
import { FileDownloadService } from 'src/app/services/file-download.service';
@Component({
  selector: 'app-add-segment',
  templateUrl: './add-segment.page.html',
  styleUrls: ['./add-segment.page.scss'],
})
export class AddSegmentPage implements OnInit {
  segmentId: any;
  excelUpload: boolean = false;
  excelData: any[] = [];
  segmentForm = this.formBuilder.group({
    segmentId: [],
    refOrgId: [null],
    refCreatedBy: [null],
    refModifiedBy: [null],
    segmentName: ['', [Validators.required]],
    description: [''],
  });
  constructor(
    private formBuilder: FormBuilder,
    private segment: SegmentService,
    private router: Router,
    private toast: ToastrService,
    private fileDownload: FileDownloadService
  ) {}
  downloadTemplate(file: string, event: any) {
    if (this.fileDownload.isNative()) {
      event.preventDefault();
    }
    this.fileDownload.templateDownload(file);
  }

  ngOnInit() {}
  excelUploadEnable() {
    this.excelUpload = !this.excelUpload ? true : false;
  }
  addSegment() {
    if (this.segmentForm.valid) {
      if (this.segmentId) {
      } else {
        const data = {
          refOrgId: this.segmentForm.value.refOrgId,
          refCreatedBy: this.segmentForm.value.refCreatedBy,
          refModifiedBy: this.segmentForm.value.refModifiedBy,
          segmentName: this.segmentForm.value.segmentName,
          description: this.segmentForm.value.description,
        };
        this.segment.addSegment(data).subscribe({
          next: () => {
            this.toast.success('Record Saved Successfully');
            this.router.navigate(['segment']);
          },
          error: () => this.toast.danger('Failed to save segment'),
        });
      }
    } else {
      this.toast.danger('Please enter segment name');
    }
  }
  upload() {
    const rows = [...this.excelData];
    const total = rows.length;
    let index = 0;
    let saved = 0;
    let failed = 0;
    const processNext = () => {
      if (index >= total) {
        this.toast[failed === 0 ? 'success' : 'warning'](
          `Uploaded ${saved} of ${total} segment(s)${failed ? ` (${failed} failed)` : ''}`
        );
        this.router.navigate(['segment']);
        return;
      }
      const row = rows[index];
      const name = row.segmentName ?? row.SegmentName ?? row.segment;
      const data = {
        refOrgId: this.segmentForm.value.refOrgId,
        refCreatedBy: this.segmentForm.value.refCreatedBy,
        refModifiedBy: this.segmentForm.value.refModifiedBy,
        segmentName: name,
        description: row.description ?? row.Description ?? '',
      };
      this.segment.addSegment(data).subscribe({
        next: () => {
          saved++;
          index++;
          processNext();
        },
        error: (err) => {
          console.log(err);
          failed++;
          index++;
          processNext();
        },
      });
    };
    if (total === 0) {
      this.toast.danger('No rows found in the selected file');
      return;
    }
    processNext();
  }
  onFileSelected(event: any) {
    this.excelData = [];
    const file: any = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    fileReader.onload = () => {
      const workbook = XLSX.read(fileReader.result, { type: 'binary' });
      const sheetNames = workbook.SheetNames;
      this.excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
    };
  }
}
