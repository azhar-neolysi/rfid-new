import { Component, OnInit } from '@angular/core';
import { ReferenceService } from '../reference.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reference',
  templateUrl: './reference.page.html',
  styleUrls: ['./reference.page.scss'],
})
export class ReferencePage implements OnInit {
  referenceItems: any = [];
  referenceItemsTemp: any = [];
  constructor(private reference: ReferenceService,private router:Router) {}

  ngOnInit() {
    this.getReference();
  }
  getReference() {
    this.reference.getReference().subscribe((res: any) => {
      console.log(res);
      this.referenceItems = res;
      this.referenceItemsTemp = res;
    });
  }
  deleteRef(referenceId: any) {
    this.reference.deleteReference(referenceId).subscribe((res: any) => {
      console.log(res);
      window.location.reload();
    });
  }
  addReference(){
    this.router.navigate(['add-reference']);
  }
  editReference(id:any){
    this.router.navigate(['add-reference',id]);
  }
  search(event:any){

    this.referenceItems = this.referenceItemsTemp;
    console.log(this.referenceItems);
    console.log(event.detail.value);
    if (event.detail.value==='') {
      this.referenceItems=this.referenceItemsTemp;

      // this.vehicleList = this.vehicleListTemp;
      // this.vehicleList = this.vehicleList;
    } else {
      this.referenceItems = this.referenceItems.filter((item: any) =>
        item.name.toLowerCase().includes(event.detail.value.toLowerCase())
      );
      console.log(this.referenceItems);
    }
  }
}
