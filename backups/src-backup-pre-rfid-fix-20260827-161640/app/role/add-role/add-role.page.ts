import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
import { RoleService } from '../../employees/role.service';
import { Role } from 'src/app/models/role.model';

@Component({
  selector: 'app-add-role',
  templateUrl: './add-role.page.html',
  styleUrls: ['./add-role.page.scss'],
})
export class AddRolePage implements OnInit {
  roleForm = this.fb.group({
    roleId: [null],
    roleName: ['', [Validators.required]],
    description: [''],
    refOrgId: [null],
    isActive: ['true'],
    isDeleted: ['false'],
  });

  roleId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.roleId = params['id'] ? Number(params['id']) : null;
      if (this.roleId) {
        this.loadRole();
      }
    });
  }

  loadRole() {
    this.roleService.getRole(this.roleId!).subscribe({
      next: (res: Role) => {
        this.roleForm.patchValue({
          roleId: res.roleId,
          roleName: res.roleName,
          description: res.description,
          refOrgId: res.refOrgId,
          isActive: res.isActive,
          isDeleted: res.isDeleted,
        } as any);
      },
      error: () => this.toast.danger('Failed to load role'),
    });
  }

  save() {
    if (!this.roleForm.valid) {
      this.toast.danger('Please enter role name');
      return;
    }
    const data = this.roleForm.value;
    if (this.roleId) {
      this.roleService.updateRole(data as any).subscribe({
        next: () => {
          this.toast.success('Role updated');
          this.router.navigate(['role']);
        },
        error: () => this.toast.danger('Failed to save role'),
      });
    } else {
      this.roleService.addRole(data).subscribe({
        next: () => {
          this.toast.success('Role created');
          this.router.navigate(['role']);
        },
        error: () => this.toast.danger('Failed to save role'),
      });
    }
  }
}
