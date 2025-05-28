import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { VrModeComponent } from './vr-mode.component';

describe('VrModeComponent', () => {
  let component: VrModeComponent;
  let fixture: ComponentFixture<VrModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VrModeComponent],
      imports: [FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(VrModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize B+ tree', () => {
    expect(component['bPlusTree']).toBeTruthy();
    expect(component['bPlusTree']?.keys).toEqual([10, 20]);
  });

  it('should toggle VR mode', () => {
    const initialMode = component.isVRMode;
    component.toggleVRMode();
    expect(component.isVRMode).toBe(!initialMode);
  });

  it('should toggle auto rotate', () => {
    const initialRotate = component.autoRotate;
    component.toggleAutoRotate();
    expect(component.autoRotate).toBe(!initialRotate);
  });

  it('should reset view', () => {
    component.resetView();
    expect(component.cameraDistance).toBe(20);
  });
});
