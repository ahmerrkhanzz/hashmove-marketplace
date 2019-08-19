import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestSpecialPriceComponent } from './request-special-price.component';

describe('RequestSpecialPriceComponent', () => {
  let component: RequestSpecialPriceComponent;
  let fixture: ComponentFixture<RequestSpecialPriceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestSpecialPriceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestSpecialPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
