import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import {
  CustomNodeComponent,
  DragHandleDirective,
  HandleComponent,
  SelectableDirective,
  Vflow,
} from 'ngx-vflow';
import { cn, MmcBadge, MmcDivider } from '@forge/ui';
import {
  DialogueNode,
  DialogueNodeAction,
  IDialogueNode,
  IDialogueNodeAction,
} from '../../../models';
import { ClassValue } from 'clsx';

@Component({
  selector: 'node-graph',
  templateUrl: 'graph-node.component.html',
  styleUrl: 'graph-node.component.scss',
  imports: [
    Vflow,
    ReactiveFormsModule,
    DragHandleDirective,
    HandleComponent,
    MmcBadge,
    MmcDivider,
  ],
  hostDirectives: [SelectableDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-node-id]': 'data()?.ID()',
    '[class]': 'classNames()',
  },
})
export class GraphNodeComponent extends CustomNodeComponent<DialogueNode> {
  readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });
  readonly select = output<string>();
  readonly dropCard =
    output<CdkDragDrop<DialogueNode, DialogueNode, DialogueNodeAction>>();

  onAddAction(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
  }

  onAddCondition(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    // TODO: Add a condition to the node
  }

  onDropAction(event: CdkDragDrop<any>): void {
    // if (event.previousContainer == event.container) {
    //     moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    // } else {
    //     transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    // }

    if (event.previousContainer == event.container) {
      moveItemInArray(
        event.container.data.actions,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      if (event.item.data.id) {
        transferArrayItem(
          event.previousContainer.data.actions,
          event.container.data.actions,
          event.previousIndex,
          event.currentIndex,
        );
        this.dropCard.emit(event);
      } else {
        console.log(event.previousContainer.data[event.previousIndex]);
        // this.model().cards.push(
        //   WorkflowCard.update(
        //     event.previousContainer.data[event.previousIndex],
        //     WorkflowCard.withLid(new Date().getTime().toString())
        //   )
        // );
      }
    }
  }

  protected classNames = computed(() =>
    cn(
      // Note: Using 'contents' display to work correctly inside SVG foreignObject wrapper
      'contents',
      this.additionalClasses(),
    ),
  );
}
