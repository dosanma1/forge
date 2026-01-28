import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideTrash, lucideType, lucideZap } from '@ng-icons/lucide';
import { ActionType, IDialogueNodeAction } from '../../../models';
import { HandleComponent, Vflow } from 'ngx-vflow';
import { MmcButton, MmcIcon } from '@forge/ui';
import { HandlerComponent } from '../../handler/handler.component';

@Component({
  selector: 'mmc-standard-action',
  templateUrl: './standard-action.component.html',
  styleUrl: './standard-action.component.scss',
  imports: [
    Vflow,
    HandleComponent,
    CdkDrag,
    CdkDragPlaceholder,
    MmcButton,
    MmcIcon,
    CommonModule,
    HandlerComponent,
  ],
  viewProviders: [provideIcons({ lucideTrash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
})
export class StandardActionComponent {
  readonly id = input.required<number>();
  readonly nodeId = input.required<string>();
  readonly action = input.required<IDialogueNodeAction>();

  readonly deleteActionEvent = output<IDialogueNodeAction>();

  deleteAction(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    console.log('Deleting action:', this.action());
    this.deleteActionEvent.emit(this.action());
  }

  protected readonly ActionType = ActionType;

  get handlerID(): string {
    return `action-${this.id()}-${this.nodeId()}`;
  }
}
