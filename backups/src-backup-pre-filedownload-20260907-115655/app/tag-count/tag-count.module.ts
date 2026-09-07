import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TagCountPageRoutingModule } from './tag-count-routing.module';

import { TagCountPage } from './tag-count.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TagCountPageRoutingModule],
  declarations: [TagCountPage],
})
export class TagCountPageModule {}
