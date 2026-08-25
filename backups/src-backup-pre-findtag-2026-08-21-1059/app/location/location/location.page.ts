import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ToastrService } from 'src/app/services/toastr/toastr.service';
import { LocationService } from '../location.service';
import { Location } from 'src/app/models/location.model';

@Component({
  selector: 'app-location',
  templateUrl: './location.page.html',
  styleUrls: ['./location.page.scss'],
})
export class LocationPage implements OnInit {
  locations: Location[] = [];
  searchTerm = '';

  constructor(
    private locationService: LocationService,
    private router: Router,
    private alertCtrl: AlertController,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.locationService.getLocations().subscribe((res: Location[]) => {
      this.locations = res;
    });
  }

  get filteredLocations(): Location[] {
    if (!this.searchTerm) return this.locations;
    const term = this.searchTerm.toLowerCase();
    return this.locations.filter(
      (l) =>
        l.address1?.toLowerCase().includes(term) ||
        l.address2?.toLowerCase().includes(term) ||
        l.pin?.toLowerCase().includes(term)
    );
  }

  addLocation() {
    this.router.navigate(['add-location']);
  }

  editLocation(loc: Location) {
    this.router.navigate(['add-location', loc.locationId]);
  }

  async deleteLocation(loc: Location) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Delete location "${loc.address1}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.locationService.deleteLocation(loc.locationId).subscribe(() => {
              this.toast.success('Location deleted');
              this.loadLocations();
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
