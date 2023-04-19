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

@Component({
  selector: 'app-add-reference-list',
  templateUrl: './add-reference-list.page.html',
  styleUrls: ['./add-reference-list.page.scss'],
})
export class AddReferenceListPage implements OnInit {
  referenceListFrom = this.formBuilder.group({
    refNo: [],
    refOrgId: [0],
    refReferenceId: ['', [Validators.required]],
    isActive: [true],
    isDeleted: [false],
    refCreatedBy: [0],
    createdDate: [new Date()],
    refModifiedBy: [0],
    modifiedDate: [null],
    refListName: ['', [Validators.required]],
    refDescription: ['', [Validators.required]],
  });
  references: any = [];
  refListNo: any;
  constructor(
    private formBuilder: FormBuilder,
    private reference: ReferenceService,
    private referenceList: ReferenceListService,
    private route: ActivatedRoute,
    private router: Router
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
  }
  getReference() {
    this.reference.getReference().subscribe((res: any) => {
      console.log(res);
      this.references = res;
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
          isActive: this.referenceListFrom.value.isActive,
          isDeleted: this.referenceListFrom.value.isDeleted,
          refCreatedBy: this.referenceListFrom.value.refCreatedBy,
          createdDate: this.referenceListFrom.value.createdDate,
          refModifiedBy: this.referenceListFrom.value.refModifiedBy,
          modifiedDate: this.referenceListFrom.value.modifiedDate,
        };
        console.log(data);
        this.referenceList.updateReferenceList(data).subscribe((res: any) => {
          console.log(res);
          this.router.navigate(['reference']);
        });
      } else {
        const data = {
          // refReferenceId: this.referenceListFrom.value.refReferenceId,
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
        this.referenceList.addReferenceList(data).subscribe((res: any) => {
          console.log(res);
          window.location.reload();
        });
      }
    } else {
      console.log('Form Not Valid');
    }
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
