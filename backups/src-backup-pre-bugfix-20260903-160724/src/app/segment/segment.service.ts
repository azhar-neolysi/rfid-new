import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { Segment } from '../models/segment.model';
import { SegmentReferenceListMapping } from '../models/segment-reference-list-mapping.model';
import { ProductEntryReferenceListMapping } from '../models/product-entry-ref-list-mapping.model';

@Injectable({ providedIn: 'root' })
export class SegmentService extends BaseService {
  getSegment(): Observable<Segment[]> {
    return this.get<Segment[]>('api/Segment');
  }

  addSegment(data: any): Observable<Segment> {
    return this.post<Segment>('api/Segment', data);
  }

  updateSegment(data: any): Observable<void> {
    return this.put<void>(`api/Segment/${data.segmentId}`, data);
  }

  deleteSegment(id: number): Observable<void> {
    return this.delete<void>(`api/Segment/${id}`);
  }

  getSegmentRefMapping(): Observable<SegmentReferenceListMapping[]> {
    return this.get<SegmentReferenceListMapping[]>('api/SegmentReferenceListMapping');
  }

  addSegmentMapping(data: any): Observable<SegmentReferenceListMapping> {
    return this.post<SegmentReferenceListMapping>('api/SegmentReferenceListMapping', data);
  }

  segmentRefList(name: string): Observable<Segment[]> {
    return this.get<Segment[]>(`api/Segment/GetSegment/?name=${name}`);
  }

  productSegmentMapping(data: any): Observable<ProductEntryReferenceListMapping> {
    return this.post<ProductEntryReferenceListMapping>('api/ProductEntryReferenceListMapping', data);
  }

  updatProductSegmentMapping(data: any): Observable<void> {
    return this.put<void>(
      `api/ProductEntryReferenceListMapping/${data.productEntryReferenceListMappingId}`,
      data
    );
  }

  productRefListMapping(productId: string): Observable<ProductEntryReferenceListMapping[]> {
    return this.get<ProductEntryReferenceListMapping[]>(
      `api/ProductEntryReferenceListMapping/GetPERLMByProductEntryId/?ProductEntryId=${productId}&ReferenceListId=`
    );
  }

  segmentRefListId(id: string): Observable<Segment[]> {
    return this.get<Segment[]>(`api/Segment/GetSegmentByReferenceListId/?ReferenceListId=${id}`);
  }
}
