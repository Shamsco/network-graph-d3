import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkGraphComponent } from './network-graph.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [
    NetworkGraphComponent
  ],
  imports: [
    CommonModule,
    MatSlideToggleModule,
    FormsModule,
    MatIconModule,
    FlexLayoutModule
  ],
  exports: [NetworkGraphComponent]
})
export class NetworkGraphModule { }
