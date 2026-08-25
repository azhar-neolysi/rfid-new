import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerDirective } from './scanner.directive';

@NgModule({
  declarations: [ScannerDirective],
  imports: [CommonModule],
  exports: [ScannerDirective],
})
export class SharedModule {}
