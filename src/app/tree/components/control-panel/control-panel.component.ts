import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.scss'],
})
export class ControlPanelComponent {
  insertValue: number = 0;
  speed: number = 1;

  @Output() insert = new EventEmitter<number>();
  @Output() pause = new EventEmitter<void>();
  @Output() speedChange = new EventEmitter<number>();
  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() exportJson = new EventEmitter<void>();
  @Output() importJson = new EventEmitter<File>();
  @Output() step = new EventEmitter<void>();
  @Output() testRotation = new EventEmitter<void>();

  searchType: string = 'dfs';

  onSearch(): void {
    this.search.emit(this.searchType);
  }

  onInsert(): void {
    this.insert.emit(this.insertValue);
  }

  onPause(): void {
    this.pause.emit();
  }

  onSpeedChange(): void {
    this.speedChange.emit(this.speed);
  }

  onClear(): void {
    this.clear.emit();
  }

  onExport(): void {
    this.exportJson.emit();
  }

  onImport(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.importJson.emit(file);
    }
  }

  onStep(): void {
    this.step.emit();
  }

  onTestRotation(): void {
    this.testRotation.emit();
  }
}
