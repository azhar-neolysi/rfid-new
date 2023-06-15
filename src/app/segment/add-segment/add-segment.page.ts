import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { SegmentService } from '../segment.service';
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
    private segment: SegmentService
  ) {}

  ngOnInit() {}
  excelUploadEnable() {
    this.excelUpload = !this.excelUpload ? true : false;
  }
  addSegment() {
    if(this.segmentForm.valid){

      if (this.segmentId) {
      } else {
        const data = {
          RefOrgId: this.segmentForm.value.refOrgId,
          RefCreatedBy: this.segmentForm.value.refCreatedBy,
          RefModifiedBy: this.segmentForm.value.refModifiedBy,
          SegmentName: this.segmentForm.value.segmentName,
          Description: this.segmentForm.value.description,
        };
        console.log(data);
        // return;
        this.segment.addSegment(data).subscribe((res: any) => {
          console.log(res);
          window.location.reload();
        });
      }
    }else{
      console.log('Form not Valid',this.segmentForm)
    }
  }
  upload() {}
  onFileSelected(event: any) {}
}
