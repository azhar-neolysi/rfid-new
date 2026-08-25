import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
import { RoleService } from '../employees/role.service';
import { Role } from 'src/app/models/role.model';

@Component({
  selector: 'app-role',
  templateUrl: './role.page.html',
  styleUrls: ['./role.page.scss'],
})
export class RolePage implements OnInit {
  roles: Role[] = [];
  searchTerm = '';

  constructor(
    private roleService: RoleService,
    private router: Router,
    private alertCtrl: AlertController,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe((res: Role[]) => {
      this.roles = res;
    });
  }

  get filteredRoles(): Role[] {
    if (!this.searchTerm) return this.roles;
    const term = this.searchTerm.toLowerCase();
    return this.roles.filter(
      (r) =>
        r.roleName?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
    );
  }

  addRole() {
    this.router.navigate(['add-role']);
  }

  editRole(role: Role) {
    this.router.navigate(['add-role', role.roleId]);
  }

  async deleteRole(role: Role) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Delete role "${role.roleName}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.roleService.deleteRole(role.roleId).subscribe(() => {
              this.toast.success('Role deleted');
              this.loadRoles();
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
