import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { EmployeeService } from '../employee.service';
import { ToastrService } from 'src/app/services/toastr/toastr.service';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.page.html',
  styleUrls: ['./employee.page.scss'],
})
export class EmployeePage implements OnInit {
  empList: any = [];
  constructor(
    private emp: EmployeeService,
    private router: Router,
    private alertCtrl: AlertController,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.getEmp();
  }
  getEmp() {
    this.emp.getEmployees().subscribe({
      next: (res: any) => {
        this.empList = res;
      },
      error: () => this.toast.danger('Failed to load employees'),
    });
  }
  search(event: any) {}
  addEmp() {
    this.router.navigate(['add-employee']);
  }
  async deleteEmp(id: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Delete this employee?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.emp.deleteEmployee(id).subscribe({
              next: () => {
                this.toast.success('Employee deleted');
                this.empList = this.empList.filter(
                  (e: any) => e.empmasterId !== id
                );
              },
              error: () => this.toast.danger('Failed to delete employee'),
            });
          },
        },
      ],
    });
    await alert.present();
  }
  editEmp(id: any) {
    this.router.navigate(['add-employee', id]);
  }
}
