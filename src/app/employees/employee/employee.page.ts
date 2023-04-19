import { Component, OnInit } from '@angular/core';
import { EmployeeService } from '../employee.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.page.html',
  styleUrls: ['./employee.page.scss'],
})
export class EmployeePage implements OnInit {
  empList: any = [];
  constructor(private emp: EmployeeService, private router: Router) {}

  ngOnInit() {
    this.getEmp();
  }
  getEmp() {
    this.emp.getEmployees().subscribe((res: any) => {
      console.log(res);
      this.empList = res;
    });
  }
  search(event: any) {}
  addEmp() {
    this.router.navigate(['add-employee']);
  }
  deleteEmp(id: any) {}
  editEmp(id: any) {
    console.log(id);
    this.router.navigate(['add-employee', id]);
  }
}
