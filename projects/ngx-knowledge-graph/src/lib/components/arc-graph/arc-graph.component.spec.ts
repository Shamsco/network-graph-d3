import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArcGraphComponent } from './arc-graph.component';

describe('ArcGraphComponent', () => {
  let component: ArcGraphComponent;
  let fixture: ComponentFixture<ArcGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArcGraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArcGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
