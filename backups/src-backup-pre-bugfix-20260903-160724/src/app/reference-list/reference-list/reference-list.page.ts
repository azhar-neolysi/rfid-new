import { Component, OnInit } from '@angular/core';
import { ReferenceListService } from '../reference-list.service';
import { ReferenceService } from 'src/app/reference/reference.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr/toastr.service';

@Component({
  selector: 'app-reference-list',
  templateUrl: './reference-list.page.html',
  styleUrls: ['./reference-list.page.scss'],
})
export class ReferenceListPage implements OnInit {
  referenceListItems: any = [];
  referenceListItemsTemp: any = [];
  references: any = [];
  ref: any;
  constructor(
    private refList: ReferenceListService,
    private reference: ReferenceService,
    private alertCtrl: AlertController,
    private toast: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    this.getRefList();
    this.getReference();
  }
  async deleteRefList(id: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Delete this reference list item?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.refList.deleteReferenceList(id).subscribe({
              next: () => {
                this.toast.success('Reference list item deleted');
                this.referenceListItems = this.referenceListItems.filter(
                  (item: any) => item.referenceListId !== id
                );
                this.referenceListItemsTemp = this.referenceListItemsTemp.filter(
                  (item: any) => item.referenceListId !== id
                );
              },
              error: () => this.toast.danger('Failed to delete reference list item'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  editReferenceList(id: any) {
    this.router.navigate(['add-reference-list', id]);
  }
  addReferenceList() {
    this.router.navigate(['add-reference-list']);
  }
  search(event: any) {
    this.referenceListItems = this.referenceListItemsTemp;
    if (event.detail.value === '') {
      this.referenceListItems = this.referenceListItemsTemp;
    } else {
      this.referenceListItems = this.referenceListItems.filter((item: any) =>
        item.name.toLowerCase().includes(event.detail.value.toLowerCase())
      );
    }
  }
  getRefList() {
    this.refList.getReferenceList().subscribe({
      next: (res: any) => {
        this.referenceListItems = res;
        this.referenceListItemsTemp = res;
      },
      error: () => this.toast.danger('Failed to load reference lists'),
    });
  }
  getReference() {
    this.reference.getReference().subscribe((res: any) => {
      this.references = res;
    });
  }
  selectRef(event: any) {
    this.referenceListItems = this.referenceListItemsTemp;
    this.referenceListItems = this.referenceListItems.filter(
      (item: any) => item.refReferenceId === event
    );
  }
}
