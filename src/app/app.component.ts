import { Component } from '@angular/core';
import * as graphData from "src/assets/kg.json";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'network-graph-d3';
  public input: any = (graphData as any).default;
}
