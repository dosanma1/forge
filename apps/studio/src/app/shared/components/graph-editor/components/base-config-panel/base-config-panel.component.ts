import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { MmcButton, MmcIcon } from '@forge/ui';
import {
  ViewportService,
  ViewportData,
} from '../../../../services/viewport.service';

/**
 * BaseConfigPanelComponent - Provides common structure for configuration panels.
 *
 * This component encapsulates the shared layout pattern:
 * - Absolute positioned container with border and shadow
 * - Header with icon, title, and close button
 * - Scrollable content area (via ng-content)
 * - Footer for action buttons (via ng-content select="[panelFooter]")
 *
 * Usage:
 * ```html
 * <base-config-panel
 *   [position]="position"
 *   [viewport]="viewport()"
 *   icon="lucideSettings"
 *   title="Configure Item"
 *   [headerBgClass]="'bg-blue-50 text-blue-700'"
 *   (close)="onClose()"
 * >
 *   <!-- Main content goes here -->
 *   <form class="p-3 space-y-3">...</form>
 *
 *   <!-- Footer actions -->
 *   <ng-container panelFooter>
 *     <button mmcButton>Save</button>
 *   </ng-container>
 * </base-config-panel>
 * ```
 */
@Component({
  selector: 'base-config-panel',
  templateUrl: './base-config-panel.component.html',
  styleUrl: './base-config-panel.component.scss',
  standalone: true,
  imports: [MmcButton, MmcIcon],
  viewProviders: [provideIcons({ lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseConfigPanelComponent {
  private readonly viewportService = inject(ViewportService);

  // ===== INPUTS =====

  /** Position in flow coordinates */
  readonly position = input.required<{ x: number; y: number }>();

  /** Current viewport state for position calculations */
  readonly viewport = input<ViewportData>({ x: 0, y: 0, zoom: 1 });

  /** Icon name from lucide icons */
  readonly icon = input<string>('lucideSettings');

  /** Panel title */
  readonly title = input<string>('Configure');

  /** Header background and text classes (e.g., 'bg-blue-50 text-blue-700') */
  readonly headerBgClass = input<string>('bg-muted text-muted-foreground');

  /** Panel width in pixels */
  readonly width = input<number>(288); // w-72

  /**
   * Origin X position for the panel positioning (similar to CDK overlay).
   * - 'start': position.x is the left edge of the element (need to add elementWidth)
   * - 'end': position.x is the right edge of the element (just add gap)
   */
  readonly originX = input<'start' | 'end'>('end');

  /** Width of the element (only needed when originX is 'start') */
  readonly elementWidth = input<number>(280);

  /** Gap between the element and the panel */
  readonly gap = input<number>(16);

  /** Whether to show the footer section */
  readonly showFooter = input<boolean>(true);

  // ===== OUTPUTS =====

  /** Emitted when the close button is clicked */
  readonly close = output<void>();

  // ===== COMPUTED =====

  protected readonly screenPosition = computed(() => {
    // When originX is 'end', position.x is already the right edge, so elementWidth = 0
    const effectiveElementWidth = this.originX() === 'end' ? 0 : this.elementWidth();

    return this.viewportService.calculatePanelPosition(
      this.position(),
      this.viewport(),
      {
        elementWidth: effectiveElementWidth,
        gap: this.gap(),
        panelWidth: this.width(),
      },
    );
  });

  protected readonly panelStyles = computed(() => {
    const pos = this.screenPosition();
    return {
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      width: `${this.width()}px`,
    };
  });

  // ===== EVENT HANDLERS =====

  protected onClose(): void {
    this.close.emit();
  }
}
