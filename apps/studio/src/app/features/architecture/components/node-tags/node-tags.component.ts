import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * NodeTagsComponent - Reusable component for displaying node tags.
 *
 * Eliminates duplicated tag rendering code found in:
 * - app-node.component.html (lines 50-66)
 * - service-node.component.html
 * - library-node.component.html
 *
 * Usage:
 * ```html
 * <app-node-tags [tags]="['backend', 'service']" />
 * ```
 */
@Component({
  selector: 'app-node-tags',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './node-tags.component.html',
  styleUrl: './node-tags.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeTagsComponent {
  /** Array of tags to display */
  readonly tags = input<string[]>([]);

  /** Maximum number of tags to show before truncating */
  readonly maxTags = input<number>(0);

  /** Additional CSS classes */
  readonly additionalClasses = input<string>('');
}
