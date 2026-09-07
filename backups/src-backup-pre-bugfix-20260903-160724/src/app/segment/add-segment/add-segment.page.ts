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
@Component({
  selector: 'app-add-segment',
  templateUrl: './add-segment.page.html',
  styleUrls: ['./add-segment.page.scss'],
})
export class AddSegmentPage implements OnInit {
  segmentId: any;
  excelUpload: boolean = false;
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
    private toast: ToastrService
  ) {}

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
  upload() {}
  onFileSelected(event: any) {}
}
