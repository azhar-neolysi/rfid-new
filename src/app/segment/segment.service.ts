import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class SegmentService {
  constructor(private http: HttpClient) {}
  getSegment() {
    return this.http.get(environment.baseUrl + `Segment`);
  }
  addSegment(data: any) {
    return this.http.post(environment.baseUrl + `Segment`, data);
  }
  updateSegment(data: any) {
    return this.http.put(
      environment.baseUrl + `Segment/${data.segmentId}`,
      data
    );
  }
  deleteSegment(id: any) {
    return this.http.delete(environment.baseUrl + `Segment/${id}`);
  }
  getSegmentRefMapping() {
    // SegmentReferenceListMapping
    return this.http.get(environment.baseUrl + `SegmentReferenceListMapping`);
  }
  addSegmentMapping(data: any) {
    return this.http.post(
      environment.baseUrl + `SegmentReferenceListMapping`,
      data
    );
  }
  segmentRefList(name: any) {
    // https://cloud.neolysi.com/rfidapi/api/segment/getsegment/?name=
    return this.http.get(
      environment.baseUrl + `segment/getsegment/?name=${name}`
    );
  }
  productSegmentMapping(data: any) {
    // ProductEntryReferenceListMapping
    return this.http.post(
      environment.baseUrl + `ProductEntryReferenceListMapping`,
      data
    );
  }
  updatProductSegmentMapping(data: any) {
    // ProductEntryReferenceListMapping
    return this.http.put(
      environment.baseUrl + `ProductEntryReferenceListMapping/${data.productEntryReferenceListMappingId}`,
      data
    );
  }
  productRefListMapping(data: any) {
    // https://cloud.neolysi.com/rfidapi/api/ProductEntryReferenceListMapping/GetPERLMByProductEntryId/?ProductEntryId=&ReferenceListId=
    return this.http.get(
      environment.baseUrl + `ProductEntryReferenceListMapping/GetPERLMByProductEntryId/?ProductEntryId=${data.productId}&ReferenceListId=`,
      data
    );
  }
segmentRefListId(id:any){
// https://cloud.neolysi.com/rfidapi/api/segment/GetSegmentByReferenceListId/?ReferenceListId=
return this.http.get(environment.baseUrl+`segment/GetSegmentByReferenceListId/?ReferenceListId=${id}`)
}
}
