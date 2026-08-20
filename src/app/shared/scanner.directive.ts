import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appScanner]',
})
export class ScannerDirective {
  @Input() scannerLength: number;
  @Output() scanComplete = new EventEmitter<string>();

  private debounceTimer: any;
  private lastValue = '';
  private readonly debounce = 200;

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const value = String(event.detail?.value ?? event.target?.value ?? '');
    this.lastValue = value;
    clearTimeout(this.debounceTimer);
    if (this.scannerLength && this.byteLength(value) === this.scannerLength) {
      this.emit();
      return;
    }
    this.debounceTimer = setTimeout(() => this.emit(), this.debounce);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      clearTimeout(this.debounceTimer);
      this.emit();
    }
  }

  private emit() {
    if (!this.lastValue) {
      return;
    }
    this.scanComplete.emit(this.lastValue);
    this.lastValue = '';
  }

  private byteLength(value: string): number {
    return new TextEncoder().encode(value).length;
  }
}
