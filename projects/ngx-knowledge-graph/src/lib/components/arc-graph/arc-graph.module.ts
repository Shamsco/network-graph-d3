import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ArcGraphComponent } from './arc-graph.component';



@NgModule({
  declarations: [
    ArcGraphComponent
  ],
  imports: [
    CommonModule,
    MatSlideToggleModule,
    FormsModule,
    MatIconModule,
    FlexLayoutModule
  ],
  exports: [ArcGraphComponent]
})
export class ArcGraphModule { }
