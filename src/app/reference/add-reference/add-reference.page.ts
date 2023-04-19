import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  Validator,
  Validators,
} from '@angular/forms';
import { ReferenceService } from '../reference.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-add-reference',
  templateUrl: './add-reference.page.html',
  styleUrls: ['./add-reference.page.scss'],
})
export class AddReferencePage implements OnInit {
  referenceForm = this.formBuilder.group({
    referenceId:[null],
    refName: ['', [Validators.required]],
    refDescription: [''],
    refOrgId: [0],
    isActive: [true],
    isDeleted: [false],
    refCreatedBy: [0],
    createdDate: [new Date()],
    refModifiedBy: [0],
    modifiedDate: [null],
  });
  refId: any;
  constructor(
    private formBuilder: FormBuilder,
    private reference: ReferenceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.refId = param['id'];
      console.log(this.refId);
      if (this.refId) {
        this.getReferenceById();
      }
    });
  }
  addReference() {
    console.log(this.referenceForm.value);
    if(this.referenceForm.valid){
      if(this.refId){
        const data = {
          referenceId:this.referenceForm.value.referenceId ,
          name: this.referenceForm.value.refName,
          description: this.referenceForm.value.refDescription,
          refOrgId:this.referenceForm.value.refOrgId,
          isActive: this.referenceForm.value.isActive,
          isDeleted: this.referenceForm.value.isDeleted,
          refCreatedBy:this.referenceForm.value.refCreatedBy,
          createdDate: this.referenceForm.value.createdDate,
          refModifiedBy:this.referenceForm.value.refModifiedBy,
          modifiedDate: this.referenceForm.value.modifiedDate,
        };
        this.reference.updateReference(data).subscribe((res: any) => {
          console.log(res);
          // this.referenceForm.reset();
          window.location.reload();
        });
      }else{
        const data = {
          referenceId:this.referenceForm.value.referenceId,
          name: this.referenceForm.value.refName,
          description: this.referenceForm.value.refDescription,
          refOrgId:this.referenceForm.value.refOrgId,
          isActive: this.referenceForm.value.isActive,
          isDeleted: this.referenceForm.value.isDeleted,
          refCreatedBy:this.referenceForm.value.refCreatedBy,
          createdDate: this.referenceForm.value.createdDate,
          refModifiedBy:this.referenceForm.value.refModifiedBy,
          modifiedDate: this.referenceForm.value.modifiedDate,
        };
        this.reference.addReference(data).subscribe((res: any) => {
          console.log(res);
          window.location.reload();

          // this.referenceForm.reset();
        });
      }
    }
  }

  getReferenceById() {
    this.reference.getReferenceById(this.refId).subscribe((res: any) => {
      console.log(res);
      // this.form.controls['dept'].setValue(selected.id);
      this.referenceForm.controls.referenceId.setValue(res.referenceId)
      this.referenceForm.controls.refName.setValue(res.name);
      this.referenceForm.controls.refDescription.setValue(res.description);
      this.referenceForm.controls.refOrgId.setValue(res.refOrgId);
      this.referenceForm.controls.isActive.setValue(res.isActive);
      this.referenceForm.controls.isDeleted.setValue(res.isDeleted);
      this.referenceForm.controls.refCreatedBy.setValue(res.refCreatedBy);
      this.referenceForm.controls.createdDate.setValue(res.createdDate);
      this.referenceForm.controls.refModifiedBy.setValue(res.refModifiedBy);
      this.referenceForm.controls.modifiedDate.setValue(res.modifiedDate);
    });
  }
}
