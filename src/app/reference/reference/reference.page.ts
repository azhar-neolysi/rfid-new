import { Component, OnInit } from '@angular/core';
import { ReferenceService } from '../reference.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ToastrService } from 'src/app/services/toastr/toastr.service';

@Component({
  selector: 'app-reference',
  templateUrl: './reference.page.html',
  styleUrls: ['./reference.page.scss'],
})
export class ReferencePage implements OnInit {
  referenceItems: any = [];
  referenceItemsTemp: any = [];
  constructor(
    private reference: ReferenceService,
    private router: Router,
    private alertCtrl: AlertController,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.getReference();
  }
  getReference() {
    this.reference.getReference().subscribe({
      next: (res: any) => {
        this.referenceItems = res;
        this.referenceItemsTemp = res;
      },
      error: () => this.toast.danger('Failed to load references'),
    });
  }
  async deleteRef(referenceId: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Delete this reference?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.reference.deleteReference(referenceId).subscribe({
              next: () => {
                this.toast.success('Reference deleted');
                this.referenceItems = this.referenceItems.filter(
                  (item: any) => item.referenceId !== referenceId
                );
                this.referenceItemsTemp = this.referenceItemsTemp.filter(
                  (item: any) => item.referenceId !== referenceId
                );
              },
              error: () => this.toast.danger('Failed to delete reference'),
            });
          },
        },
      ],
    });
    await alert.present();
  }
  addReference() {
    this.router.navigate(['add-reference']);
  }
  editReference(id: any) {
    this.router.navigate(['add-reference', id]);
  }
  search(event: any) {
    this.referenceItems = this.referenceItemsTemp;
    if (event.detail.value === '') {
      this.referenceItems = this.referenceItemsTemp;
    } else {
      this.referenceItems = this.referenceItems.filter((item: any) =>
        item.name.toLowerCase().includes(event.detail.value.toLowerCase())
      );
    }
  }
}
