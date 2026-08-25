import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  Validator,
  Validators,
} from '@angular/forms';
import { ReferenceService } from 'src/app/reference/reference.service';
import { ReferenceListService } from '../reference-list.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SegmentService } from 'src/app/segment/segment.service';

@Component({
  selector: 'app-add-reference-list',
  templateUrl: './add-reference-list.page.html',
  styleUrls: ['./add-reference-list.page.scss'],
})
export class AddReferenceListPage implements OnInit {
  referenceListFrom = this.formBuilder.group({
    refNo: [],
    refOrgId: [null],
    refReferenceId: ['', [Validators.required]],
    refReferenceListId: [],
    isActive: [true],
    isDeleted: [false],
    refCreatedBy: [null],
    createdDate: [new Date()],
    refModifiedBy: [null],
    segment: [''],
    modifiedDate: [null],
    refListName: ['', [Validators.required]],
    refDescription: ['', [Validators.required]],
  });
  references: any = [];
  refListNo: any;
  segments: any = [];
  constructor(
    private formBuilder: FormBuilder,
    private reference: ReferenceService,
    private referenceList: ReferenceListService,
    private route: ActivatedRoute,
    private router: Router,
    private segment: SegmentService
  ) {}

  ngOnInit() {
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.refListNo = param['id'];
      console.log(this.refListNo);
      if (this.refListNo) {
        this.getRefList();
      }
    });
    this.getReference();
    this.getSegment();
  }
  getReference() {
    this.reference.getReference().subscribe((res: any) => {
      console.log(res);
      this.references = res;
    });
  }
  getSegment() {
    this.segment.getSegment().subscribe((res: any) => {
      console.log(res);
      this.segments = res;
    });
  }
  addReferenceList() {
    console.log(this.referenceListFrom.value);
    console.log(this.referenceListFrom);
    if (this.referenceListFrom.valid) {
      if (this.refListNo) {
        const data = {
          refReferenceId: this.referenceListFrom.value.refReferenceId,
          name: this.referenceListFrom.value.refListName,
          description: this.referenceListFrom.value.refDescription,
          refOrgId: this.referenceListFrom.value.refOrgId,

          refCreatedBy: this.referenceListFrom.value.refCreatedBy,

          refModifiedBy: this.referenceListFrom.value.refModifiedBy,
        };
        console.log(data);
        this.referenceList.updateReferenceList(data).subscribe((res: any) => {
          console.log(res);
          this.router.navigate(['reference']);
        });
      } else {
        const data = {
          refReferenceId: this.referenceListFrom.value.refReferenceId,
          name: this.referenceListFrom.value.refListName,
          description: this.referenceListFrom.value.refDescription,
          refOrgId: this.referenceListFrom.value.refOrgId,
          isActive: this.referenceListFrom.value.isActive,
          isDeleted: this.referenceListFrom.value.isDeleted,
          refCreatedBy: this.referenceListFrom.value.refCreatedBy,
          createdDate: this.referenceListFrom.value.createdDate,
          refModifiedBy: this.referenceListFrom.value.refModifiedBy,
          modifiedDate: this.referenceListFrom.value.modifiedDate,
        };
        console.log(data);
        this.referenceList.addReferenceList(data).subscribe((res: any) => {
          console.log(res);
          this.referenceListFrom.controls.refReferenceListId.setValue(res.referenceListId);
          this.segmentMapping();
          // return;
          // window.location.reload();
        });
      }
    } else {
      console.log('Form Not Valid');
    }
  }
  segmentMapping() {
    const data = {
      refOrgId: this.referenceListFrom.value.refOrgId,
      refCreatedBy: this.referenceListFrom.value.refCreatedBy,
      refModifiedBy: this.referenceListFrom.value.refModifiedBy,
      refSegmentId: this.referenceListFrom.value.segment,
      refReferenceListId: this.referenceListFrom.value.refReferenceListId,
    };
    this.segment.addSegmentMapping(data).subscribe((res:any)=>{
      console.log(res);
      window.location.reload();
    })
  }
  getRefList() {
    this.referenceList
      .getReferenceListId(this.refListNo)
      .subscribe((res: any) => {
        console.log(res);
        this.referenceListFrom.controls.createdDate.setValue(res.createdDate);
        this.referenceListFrom.controls.isActive.setValue(res.isActive);
        this.referenceListFrom.controls.isDeleted.setValue(res.isDeleted);
        this.referenceListFrom.controls.modifiedDate.setValue(res.modifiedDate);
        this.referenceListFrom.controls.refCreatedBy.setValue(res.refCreatedBy);
        this.referenceListFrom.controls.refDescription.setValue(
          res.description
        );
        this.referenceListFrom.controls.refListName.setValue(res.name);
        this.referenceListFrom.controls.refModifiedBy.setValue(
          res.refModifiedBy
        );
        this.referenceListFrom.controls.refNo.setValue(res.referenceListId);
        this.referenceListFrom.controls.refOrgId.setValue(res.refOrgId);
        this.referenceListFrom.controls.refReferenceId.setValue(
          res.refReferenceId
        );
      });
  }
  selectRef(event: any) {
    console.log(event);
  }
}
