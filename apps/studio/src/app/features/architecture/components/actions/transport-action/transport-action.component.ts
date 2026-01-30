import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { CdkDrag, CdkDragPreview, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { MmcButton, MmcIcon } from '@forge/ui';

export type TransportType = 'http' | 'grpc' | 'nats';

@Component({
  selector: 'app-transport-action',
  standalone: true,
  imports: [MmcButton, MmcIcon, CdkDrag, CdkDragPreview, CdkDragPlaceholder],
  templateUrl: './transport-action.component.html',
  styleUrl: './transport-action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportActionComponent {
  /** Transport type identifier */
  readonly type = input.required<TransportType>();

  /** Display label for the action */
  readonly label = input.required<string>();

  /** Lucide icon name */
  readonly icon = input.required<string>();

  /** Whether the action is disabled */
  readonly disabled = input<boolean>(false);

  /** Emitted when the action is triggered (click or drop) */
  readonly add = output<TransportType>();

  protected onClick(): void {
    if (!this.disabled()) {
      this.add.emit(this.type());
    }
  }
}
