import { Component, OnInit } from '@angular/core';
import { ReferenceListService } from '../reference-list.service';
import { ReferenceService } from 'src/app/reference/reference.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

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
    private toast: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.getRefList();
    this.getReference();
  }
  deleteRefList(id: any) {
    this.refList.deleteReferenceList(id).subscribe(async (res: any) => {
      console.log(res);
      const toast = await this.toast.create({
        message: 'Deleted',
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
      toast.present();

      window.location.reload();
    });
  }

  editReferenceList(id: any) {
    this.router.navigate(['add-reference-list', id]);
  }
  addReferenceList() {
    this.router.navigate(['add-reference-list']);
  }
  search(event: any) {
    this.referenceListItems = this.referenceListItemsTemp;
    console.log(this.referenceListItems);
    console.log(event.detail.value);
    if (event.detail.value === '') {
      this.referenceListItems = this.referenceListItemsTemp;

      // this.vehicleList = this.vehicleListTemp;
      // this.vehicleList = this.vehicleList;
    } else {
      this.referenceListItems = this.referenceListItems.filter((item: any) =>
        item.name.toLowerCase().includes(event.detail.value.toLowerCase())
      );
      console.log(this.referenceListItems);
    }
  }
  getRefList() {
    this.refList.getReferenceList().subscribe((res: any) => {
      console.log(res);
      this.referenceListItems = res;
      this.referenceListItemsTemp = res;
    });
  }
  getReference() {
    this.reference.getReference().subscribe((res: any) => {
      console.log(res);
      this.references = res;
    });
  }
  selectRef(event: any) {
    console.log(event);
    this.referenceListItems = this.referenceListItemsTemp;
    this.referenceListItems = this.referenceListItems.filter(
      (item: any) => item.refReferenceId === event
    );
    console.log(this.referenceListItems);
  }
}
