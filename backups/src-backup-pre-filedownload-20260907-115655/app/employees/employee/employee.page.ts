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

  private badgeHtml(emp: any): string {
    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '—';
    const id = emp.employeeId ?? '';
    const gender = emp.gender ? String(emp.gender) : '';
    const dob = emp.dob ? new Date(emp.dob).toLocaleDateString() : '';
    const doj = emp.doj ? new Date(emp.doj).toLocaleDateString() : '';
    const mobile = emp.mobileNo ? String(emp.mobileNo) : '';
    const email = emp.email ? String(emp.email) : '';
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Employee Badge - ${name}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; background: #f0f2f5; box-sizing: border-box; }
  .card { width: 360px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,.14); border: 1px solid #e3e6ea; }
  .head { background: #1f3a6e; color: #fff; padding: 16px 20px; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
  .body { padding: 20px; text-align: center; }
  .avatar { width: 96px; height: 96px; margin: 0 auto 12px; border-radius: 50%;
            background: #dfe6f0; color: #1f3a6e; display: flex; align-items: center; justify-content: center;
            font-size: 40px; font-weight: 700; border: 3px solid #1f3a6e; }
  .name { font-size: 20px; font-weight: 700; color: #111; margin: 0 0 2px; }
  .id { font-size: 14px; color: #666; margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left; font-size: 13px; }
  .grid .lbl { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
  .grid .val { font-weight: 600; color: #222; }
  .foot { padding: 12px; text-align: center; font-size: 12px; color: #999; background: #f7f9fc; border-top: 1px solid #eef1f5; }
  @media print { body { background: #fff; } .card { box-shadow: none; border: 1px solid #999; } }
</style>
</head>
<body>
  <div class="card">
    <div class="head">Employee Badge</div>
    <div class="body">
      <div class="avatar">${(name || '?').charAt(0).toUpperCase()}</div>
      <div class="name">${name}</div>
      <div class="id">Emp ID: ${id}</div>
      <div class="grid">
        <div><div class="lbl">Gender</div><div class="val">${gender || '—'}</div></div>
        <div><div class="lbl">Mobile</div><div class="val">${mobile || '—'}</div></div>
        <div><div class="lbl">DoB</div><div class="val">${dob || '—'}</div></div>
        <div><div class="lbl">DoJ</div><div class="val">${doj || '—'}</div></div>
        <div style="grid-column: 1 / -1;"><div class="lbl">Email</div><div class="val">${email || '—'}</div></div>
      </div>
    </div>
    <div class="foot">${new Date().toLocaleDateString()}</div>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body>
</html>`;
  }

  printBadge(emp: any) {
    const win = window.open('', '_blank', 'width=460,height=640');
    if (!win) {
      this.toast.danger('Popup blocked - allow popups to print the badge');
      return;
    }
    win.document.write(this.badgeHtml(emp));
    win.document.close();
  }

  downloadBadge(emp: any) {
    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'employee';
    const blob = new Blob([this.badgeHtml(emp)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badge-${name.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast.success('Badge downloaded');
  }
}
