import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
import { LocationService } from '../location.service';
import { Location } from 'src/app/models/location.model';

@Component({
  selector: 'app-add-location',
  templateUrl: './add-location.page.html',
  styleUrls: ['./add-location.page.scss'],
})
export class AddLocationPage implements OnInit {
  locationForm = this.fb.group({
    locationId: [null],
    address1: ['', [Validators.required]],
    address2: [''],
    address3: [''],
    address4: [''],
    pin: [''],
    refReferenceListCityId: [null],
    refReferenceListStateId: [null],
    refReferenceListCountryId: [null],
    refOrgId: [null],
    refCreatedBy: [null],
    refModifiedBy: [null],
  });

  locationId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.locationId = params['id'] ? Number(params['id']) : null;
      if (this.locationId) {
        this.loadLocation();
      }
    });
  }

  loadLocation() {
    this.locationService.getLocation(this.locationId!).subscribe((res: Location) => {
      this.locationForm.patchValue(res as any);
    });
  }

  save() {
    if (!this.locationForm.valid) {
      this.toast.danger('Please enter address');
      return;
    }
    const data = this.locationForm.value;
    if (this.locationId) {
      this.locationService.updateLocation(data as any).subscribe(() => {
        this.toast.success('Location updated');
        this.router.navigate(['location']);
      });
    } else {
      this.locationService.addLocation(data).subscribe(() => {
        this.toast.success('Location created');
        this.router.navigate(['location']);
      });
    }
  }
}
