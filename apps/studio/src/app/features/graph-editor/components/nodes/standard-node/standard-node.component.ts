import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideCode,
  lucideGitBranch,
  lucideType,
  lucideVariable,
} from '@ng-icons/lucide';
import {
  CustomNodeComponent,
  DragHandleDirective,
  HandleComponent,
  SelectableDirective,
  Vflow,
} from 'ngx-vflow';
import { cn, MmcBadge, MmcIcon } from '@forge/ui';
import { HandlerComponent } from '../../handler/handler.component';
import {
  ActionType,
  DialogueNode,
  TransitionOption,
} from '../../../models';
import { ClassValue } from 'clsx';

@Component({
  selector: 'node-standard',
  templateUrl: 'standard-node.component.html',
  styleUrl: 'standard-node.component.scss',
  imports: [
    Vflow,
    DragHandleDirective,
    HandleComponent,
    MmcBadge,
    MmcIcon,
    HandlerComponent,
  ],
  hostDirectives: [SelectableDirective],
  viewProviders: [
    provideIcons({
      lucideChevronRight,
      lucideCode,
      lucideGitBranch,
      lucideType,
      lucideVariable,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-node-id]': 'data()?.ID()',
    '[class]': 'classNames()',
  },
})
export class StandardNodeComponent extends CustomNodeComponent<DialogueNode> {
  readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });

  protected classNames = computed(() =>
    cn('contents', this.additionalClasses()),
  );

  protected readonly ActionType = ActionType;

  protected getActionIcon(type: ActionType): string {
    switch (type) {
      case ActionType.Text:
        return 'lucideType';
      case ActionType.ExecuteCode:
        return 'lucideCode';
      case ActionType.Transition:
      case ActionType.OpenChildGraph:
        return 'lucideGitBranch';
      case ActionType.FillVariable:
        return 'lucideVariable';
      default:
        return 'lucideCode';
    }
  }

  protected getActionLabel(type: ActionType): string {
    switch (type) {
      case ActionType.Text:
        return 'Text Message';
      case ActionType.ExecuteCode:
        return 'Execute Code';
      case ActionType.Transition:
        return 'Transition';
      case ActionType.OpenChildGraph:
        return 'Open Child Graph';
      case ActionType.FillVariable:
        return 'Fill Variable';
      default:
        return 'Action';
    }
  }

  /** Get all transition options across all actions for handle generation */
  protected getAllTransitionOptions(): Array<{
    actionId: string;
    option: TransitionOption;
  }> {
    const actions = this.data()?.actions || [];
    const result: Array<{ actionId: string; option: TransitionOption }> = [];

    for (const action of actions) {
      if (action.type === ActionType.Transition && action.options) {
        for (const option of action.options) {
          result.push({ actionId: action.id || '', option });
        }
      }
    }

    return result;
  }

  /**
   * Calculate Y offset for each handle to align with its corresponding option row.
   * ngx-vflow auto-distributes handles evenly, so we offset to counteract that.
   * @param index - The index of the handle (0-based)
   * @returns Y offset in pixels
   */
  protected getHandleYOffset(index: number): number {
    const totalOptions = this.getAllTransitionOptions().length;
    if (totalOptions <= 1) return 0;

    // Row height based on py-1.5 (6px*2) + line height (~16px) = ~28px per row
    const rowHeight = 28;
    // Center point offset - handles should fan out from center
    const centerIndex = (totalOptions - 1) / 2;
    const offsetFromCenter = index - centerIndex;

    return offsetFromCenter * rowHeight;
  }
}
