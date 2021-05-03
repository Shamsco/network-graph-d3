import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkGraphComponent } from './network-graph.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


@NgModule({
  declarations: [
    NetworkGraphComponent
  ],
  imports: [
    CommonModule,
    MatSlideToggleModule
  ]
})
export class NetworkGraphModule { }
