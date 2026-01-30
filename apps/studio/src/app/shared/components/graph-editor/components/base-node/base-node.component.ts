import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  DragHandleDirective,
  HandleComponent,
} from 'ngx-vflow';
import { MmcBadge, MmcIcon } from '@forge/ui';
import { HandlerComponent } from '../handler/handler.component';
import { NodeTagsComponent } from '../../../node-tags/node-tags.component';
import { NodeStyleService } from '../../../../services/node-style.service';
import { NodeColorScheme } from '../../../../models/node-styling.model';

/**
 * BaseNodeComponent - Provides common structure and styling for all graph nodes.
 *
 * This component encapsulates the shared layout pattern:
 * - Card container with selection border
 * - Header with drag handle, icon, title, and badge
 * - Target handle on the left
 * - Body content area (via ng-content)
 * - Tags section
 * - Source handle on the right
 *
 * Usage:
 * ```html
 * <base-node
 *   [nodeId]="data()?.id"
 *   [nodeName]="data()?.name"
 *   [tags]="data()?.tags"
 *   [selected]="selected()"
 *   colorScheme="blue"
 *   icon="lucideServer"
 *   [badge]="getLanguageBadge()"
 *   (doubleClick)="onDoubleClick()"
 * >
 *   <!-- Custom body content goes here -->
 *   <div class="text-xs">Custom content...</div>
 * </base-node>
 * ```
 */
@Component({
  selector: 'base-node',
  templateUrl: './base-node.component.html',
  styleUrl: './base-node.component.scss',
  standalone: true,
  imports: [
    DragHandleDirective,
    HandleComponent,
    MmcBadge,
    MmcIcon,
    HandlerComponent,
    NodeTagsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
})
export class BaseNodeComponent {
  private readonly styleService = inject(NodeStyleService);

  // ===== INPUTS =====

  /** Node ID - used for handle IDs */
  readonly nodeId = input<string>('');

  /** Node name displayed in the header */
  readonly nodeName = input<string>('');

  /** Tags to display in the footer */
  readonly tags = input<string[]>([]);

  /** Whether the node is currently selected */
  readonly selected = input<boolean>(false);

  /** Color scheme for theming (blue, green, purple, gray) */
  readonly colorScheme = input<NodeColorScheme>('blue');

  /** Icon name from lucide icons */
  readonly icon = input<string>('lucidePackage');

  /** Badge text (e.g., "Go", "Angular", "TypeScript") */
  readonly badge = input<string>('');

  /** Whether to show the badge (defaults to true if badge text is provided) */
  readonly showBadge = input<boolean | undefined>(undefined);

  /** Whether to show the target (input) handle */
  readonly showTargetHandle = input<boolean>(true);

  /** Whether to show the source (output) handle */
  readonly showSourceHandle = input<boolean>(true);

  // ===== OUTPUTS =====

  /** Emitted when the node is double-clicked */
  readonly doubleClick = output<void>();

  // ===== COMPUTED STYLES =====

  protected readonly styles = computed(() => {
    return this.styleService.getStylesByScheme(this.colorScheme());
  });

  protected readonly containerClasses = computed(() => {
    const base = 'w-[280px] min-w-[240px] max-w-[320px] rounded-lg bg-card shadow-sm overflow-hidden';
    const border = this.selected() ? 'border border-primary' : 'border border-border';
    return `${base} ${border}`;
  });

  protected readonly headerClasses = computed(() => {
    const s = this.styles();
    return `flex items-center justify-between px-3 py-2 ${s.bgClass} border-b ${s.borderClass} cursor-move`;
  });

  protected readonly iconClasses = computed(() => {
    return `${this.styles().iconClass} shrink-0`;
  });

  protected readonly badgeClasses = computed(() => {
    const s = this.styles();
    // Extract text and ring colors from badgeClass, add bg
    return `ring-1 ${s.badgeClass}`;
  });

  protected readonly shouldShowBadge = computed(() => {
    const explicit = this.showBadge();
    if (explicit !== undefined) return explicit;
    return this.badge().length > 0;
  });

  // ===== EVENT HANDLERS =====

  protected onDoubleClick(event: Event): void {
    event.stopPropagation();
    this.doubleClick.emit();
  }
}
