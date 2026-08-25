import { Component, OnInit } from '@angular/core';
import { EmployeeService } from '../employee.service';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ReferenceListService } from 'src/app/reference-list/reference-list.service';
import { UserService } from '../user.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.page.html',
  styleUrls: ['./add-employee.page.scss'],
})
export class AddEmployeePage implements OnInit {
  empForm = this.formBuilder.group({
    employeeId: [],
    firstName: ['', [Validators.required]],
    lastName: [''],
    userName: [''],
    dob: ['', [Validators.required]],
    doj: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    mobileNo: ['', [Validators.required]],
    gender: ['Male', [Validators.required]],
    // role: ['', [Validators.required]],
    // location: ['', [Validators.required]],
    status: ['Working', [Validators.required]],
    notice: ['', [Validators.required]],
    nationality: ['Indian', [Validators.required]],
    isActive: [true],
    password: [''],
    confirmpassword: [''],
    refOrgId: [1],
    refRoleId: [''],
    refLocationId: [''],
    description: [''],
    refCreatedBy: [1],
    refModifiedBy: [null],
  });

  // data = {
  //   employeeId: 0,
  //   refOrgId: 0,
  //   refLocationId: 0,
  //   refRoleId: 0,
  //   isActive: true,
  //   isDeleted: true,
  //   refCreatedBy: 0,
  //   createdDate: '2023-04-18T08:06:44.763Z',
  //   refModifiedBy: 0,
  //   modifiedDate: '2023-04-18T08:06:44.763Z',
  //   value: 'string',
  //   firstName: 'string',
  //   lastName: 'string',
  //   gender: 'string',
  //   dob: '2023-04-18T08:06:44.763Z',
  //   doj: '2023-04-18T08:06:44.763Z',
  //   email: 'string',
  //   mobileNo: 'string',
  //   empStatus: 'string',
  //   noticePeriod: 0,
  //   nationality: 'string',
  // };
  role: any = [];
  empID: any;
  editEmpID: any;
  userID: any;
  excelUpload: boolean;
  excelData: never[];
  // datePipe = new DatePipe('en-US');
  // return datePipe.transform(date, format);
  constructor(
    private emp: EmployeeService,
    private formBuilder: FormBuilder,
    private refList: ReferenceListService,
    private user: UserService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router:Router,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    // this.emp.getEmployees().subscribe((res:any)=>{
    //   console.log(res);
    // })
    // console.log(this.empForm);
    this.getRole();
    const id = this.route.params.subscribe((param) => {
      // this.editRateId = Number(param.id);
      this.editEmpID = param['id'];
      if (this.editEmpID) {
        // this.getRFIDById();
        this.getEmp();
      }
    });
  }
  addEmployee() {
    // this.empForm.controls.isActive = 'false';
    if (this.empForm.valid) {
      if (this.editEmpID) {
        if (this.empForm.value.password === this.empForm.value.confirmpassword) {
          const data = {
            employeeId: this.empForm.value.employeeId,
            refOrgId: null,
            refLocationId: null,
            refRoleId: null,
            isActive: true,
            isDeleted: false,
            refCreatedBy: null,
            createdDate: new Date(),
            refModifiedBy: null,
            modifiedDate: new Date(),
            value: null,
            firstName: this.empForm.value.firstName,
            lastName: this.empForm.value.lastName,
            gender: this.empForm.value.gender,
            // this.datePipe.transform( new Date(),'yyyy-MM-dd  h:mm:ssZZZZZ');
            dob: this.empForm.value.dob,
            doj: this.empForm.value.doj,
            email: this.empForm.value.email,
            mobileNo: String(this.empForm.value.mobileNo),
            empStatus: '',
            noticePeriod: this.empForm.value.notice,
            nationality: this.empForm.value.nationality,
          };

          this.emp.updateEmployee(data).subscribe({
            next: () => {
              this.toast.success('Record Saved Successfully');
              this.router.navigate(['employee']);
            },
            error: () => this.toast.danger('Failed to save employee'),
          });
        } else {
          this.toast.danger('Password Mismatch');
        }
      } else {
        if (this.empForm.value.password === this.empForm.value.confirmpassword) {
          const data = {
            refOrgId: null,
            refLocationId: null,
            refRoleId: null,
            isActive: true,
            isDeleted: false,
            refCreatedBy: null,
            createdDate: new Date(),
            refModifiedBy: null,
            modifiedDate: new Date(),
            value: null,
            firstName: this.empForm.value.firstName,
            lastName: this.empForm.value.lastName,
            gender: this.empForm.value.gender,
            // this.datePipe.transform( new Date(),'yyyy-MM-dd  h:mm:ssZZZZZ');
            dob: this.empForm.value.dob,
            doj: this.empForm.value.doj,
            email: this.empForm.value.email,
            mobileNo: String(this.empForm.value.mobileNo),
            empStatus: '',
            noticePeriod: this.empForm.value.notice,
            nationality: this.empForm.value.nationality,
          };

          this.emp.addEmployee(data).subscribe({
            next: (res: any) => {
              this.empID = res.employeeId;
              this.createUser();
            },
            error: () => this.toast.danger('Failed to save employee'),
          });
        } else {
          this.toast.danger('Password Mismatch');
        }
      }
    } else {
      this.toast.danger('Please fill all required fields');
    }
  }

  getRole() {
    this.refList.getReferenceListbyRefName('Role').subscribe({
      next: (res: any) => {
        this.role = res;
      },
      error: () => this.toast.danger('Failed to load roles'),
    });
  }
  createUser() {
    const data = {
      refOrgid: null,
      isActive: true,
      refCreatedBy: null,
      createdDate: new Date(),
      refModifiedBy: null,
      modifiedDate: null,
      userName: this.empForm.value.userName,
      email: this.empForm.value.email,
      mobileNo: String(this.empForm.value.mobileNo),
      password: this.empForm.value.password,
      processing: '',
      comments: this.empForm.value.description,
      passwordHash: '',
      passwordSalt: '',
      emailVerified: false,
      isDeleted: false,
    };
    this.user.createUser(data).subscribe({
      next: (res: any) => {
        this.userID = res.userId;
        this.userMapping();
      },
      error: () => {
        this.toast.danger('Employee saved but user account creation failed');
      },
    });
  }
  userMapping() {
    const data = {
      refOrgid: null,
      refEmpId: this.empID,
      refUserId: this.userID,
      isActive: true,
      refCreatedBy: null,
      createdDate: new Date(),
      refModifiedBy: null,
      modifiedDate: new Date(),
      isDeleted: false,
    };
    this.user.createMapp(data).subscribe({
      next: () => {
        this.toast.success('Record Saved Successfully');
        this.router.navigate(['employee']);
      },
      error: () => {
        this.toast.danger('Employee saved but user mapping failed');
        this.router.navigate(['employee']);
      },
    });
  }
  getEmp() {
    this.emp.getEmployee(this.editEmpID).subscribe((res: any) => {
      this.empForm.controls.employeeId.setValue(res.employeeId);
      this.empForm.controls.description.setValue(res.description);
      this.empForm.controls.dob.setValue(
        this.datePipe.transform(res.dob, 'yyyy-MM-dd')
      );
      this.empForm.controls.doj.setValue(
        this.datePipe.transform(res.doj, 'yyyy-MM-dd')
      );
      this.empForm.controls.email.setValue(res.email);
      this.empForm.controls.firstName.setValue(res.firstName);
      this.empForm.controls.gender.setValue(res.gender);
      this.empForm.controls.isActive.setValue(res.isActive);
      this.empForm.controls.lastName.setValue(res.lastName);
      this.empForm.controls.mobileNo.setValue(res.mobileNo);
      this.empForm.controls.nationality.setValue(res.nationality);
      this.empForm.controls.notice.setValue(res.noticePeriod);
      this.empForm.controls.refCreatedBy.setValue(res.refCreatedBy);
      this.empForm.controls.refLocationId.setValue(res.refLocationId);
      this.empForm.controls.refModifiedBy.setValue(res.refModifiedBy);
      this.empForm.controls.refOrgId.setValue(res.refOrgId);
      this.empForm.controls.refRoleId.setValue(res.refRoleId);
      this.empForm.controls.status.setValue(res.status);
      // this.empForm.controls.userName.setValue(res.userName);
    });
  }
  excelUploadEnable() {
    this.excelUpload = !this.excelUpload ? true : false;
  }
  onFileSelected(event: any) {
    this.excelData = [];
    const file: any = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    fileReader.onload = (e) => {
      var workbook = XLSX.read(fileReader.result, { type: 'binary' });
      var sheetNames = workbook.SheetNames;
      this.excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
    };
  }
  upload() {
    this.excelData.forEach((element: any) => {
      this.empForm.controls.employeeId.setValue(element.employeeId);
      this.empForm.controls.description.setValue(element.description);
      this.empForm.controls.dob.setValue(
        this.datePipe.transform(element.dob, 'yyyy-MM-dd')
      );
      this.empForm.controls.doj.setValue(
        this.datePipe.transform(element.doj, 'yyyy-MM-dd')
      );
      this.empForm.controls.email.setValue(element.email);
      this.empForm.controls.firstName.setValue(element.firstName);
      this.empForm.controls.gender.setValue(element.gender);
      this.empForm.controls.isActive.setValue(element.isActive);
      this.empForm.controls.lastName.setValue(element.lastName);
      this.empForm.controls.mobileNo.setValue(element.mobileNo);
      this.empForm.controls.nationality.setValue(element.nationality);
      this.empForm.controls.notice.setValue(element.noticePeriod);
      this.empForm.controls.refCreatedBy.setValue(element.refCreatedBy);
      this.empForm.controls.refLocationId.setValue(element.refLocationId);
      this.empForm.controls.refModifiedBy.setValue(element.refModifiedBy);
      this.empForm.controls.refOrgId.setValue(element.refOrgId);
      this.empForm.controls.refRoleId.setValue(element.refRoleId);
      this.empForm.controls.status.setValue(element.status);
      this.addEmployee();
    });
  }
}
