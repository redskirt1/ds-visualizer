import { Component, Input } from '@angular/core';
import { TreeMetrics } from '../../models/metrics.model';

@Component({
  selector: 'app-metrics-display',
  standalone: true,
  templateUrl: './metrics-display.component.html',
  styleUrls: ['./metrics-display.component.scss']
})
export class MetricsDisplayComponent {
  @Input() metrics!: TreeMetrics;
}
