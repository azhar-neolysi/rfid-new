import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ToastrService } from 'src/app/services/toastr/toastr.service';

@Component({
  selector: 'app-dispatchreport',
  templateUrl: './dispatchreport.page.html',
  styleUrls: ['./dispatchreport.page.scss'],
})
export class DispatchreportPage implements OnInit {
  maxDate: string;

  reportForm = this.formBuilder.group({
    fromDate: [''],
    toDate: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
    private toast: ToastrService
  ) {
    this.maxDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit() {}

  search() {
    const from = this.reportForm.value.fromDate as string;
    const to = this.reportForm.value.toDate as string;

    if (!from) {
      this.toast.warning('Please select the From date');
      return;
    }
    if (!to) {
      this.toast.warning('Please select the To date');
      return;
    }
    if (new Date(to) < new Date(from)) {
      this.toast.danger('To date cannot be before From date');
      return;
    }
    this.toast.warning(`Report range: ${from} to ${to}`);
  }

  exportToPdf() {
    const from = this.reportForm.value.fromDate as string;
    const to = this.reportForm.value.toDate as string;
    if (!from || !to) {
      this.toast.warning('Select From and To dates before exporting');
      return;
    }
    this.toast.warning('Export is not yet available');
  }
}
