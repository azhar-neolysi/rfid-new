import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  Validator,
  Validators,
} from '@angular/forms';
import { ReferenceService } from '../reference.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
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
    refOrgId: [null],
    isActive: [true],
    isDeleted: [false],
    refCreatedBy: [null],
    createdDate: [new Date()],
    refModifiedBy: [null],
    modifiedDate: [null],
  });
  refId: any;
  constructor(
    private formBuilder: FormBuilder,
    private reference: ReferenceService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.refId = param['id'];
      if (this.refId) {
        this.getReferenceById();
      }
    });
  }
  addReference() {
    if (this.referenceForm.valid) {
      if (this.refId) {
        const data = {
          referenceId: this.referenceForm.value.referenceId,
          name: this.referenceForm.value.refName,
          description: this.referenceForm.value.refDescription,
          refOrgId: this.referenceForm.value.refOrgId,
          isActive: this.referenceForm.value.isActive,
          isDeleted: this.referenceForm.value.isDeleted,
          refCreatedBy: this.referenceForm.value.refCreatedBy,
          createdDate: this.referenceForm.value.createdDate,
          refModifiedBy: this.referenceForm.value.refModifiedBy,
          modifiedDate: this.referenceForm.value.modifiedDate,
        };
        this.reference.updateReference(data).subscribe({
          next: () => {
            this.toast.success('Record Saved Successfully');
            this.router.navigate(['reference']);
          },
          error: () => this.toast.danger('Failed to save reference'),
        });
      } else {
        const data = {
          name: this.referenceForm.value.refName,
          description: this.referenceForm.value.refDescription,
          refOrgId: this.referenceForm.value.refOrgId,
          refCreatedBy: this.referenceForm.value.refCreatedBy,
          refModifiedBy: this.referenceForm.value.refModifiedBy,
        };
        this.reference.addReference(data).subscribe({
          next: () => {
            this.toast.success('Record Saved Successfully');
            this.router.navigate(['reference']);
          },
          error: () => this.toast.danger('Failed to save reference'),
        });
      }
    } else {
      this.toast.danger('Please enter reference name');
    }
  }

  getReferenceById() {
    this.reference.getReferenceById(this.refId).subscribe({
      next: (res: any) => {
        this.referenceForm.controls.referenceId.setValue(res.referenceId);
        this.referenceForm.controls.refName.setValue(res.name);
        this.referenceForm.controls.refDescription.setValue(res.description);
        this.referenceForm.controls.refOrgId.setValue(res.refOrgId);
        this.referenceForm.controls.isActive.setValue(res.isActive);
        this.referenceForm.controls.isDeleted.setValue(res.isDeleted);
        this.referenceForm.controls.refCreatedBy.setValue(res.refCreatedBy);
        this.referenceForm.controls.createdDate.setValue(res.createdDate);
        this.referenceForm.controls.refModifiedBy.setValue(res.refModifiedBy);
        this.referenceForm.controls.modifiedDate.setValue(res.modifiedDate);
      },
      error: () => this.toast.danger('Failed to load reference'),
    });
  }
}
