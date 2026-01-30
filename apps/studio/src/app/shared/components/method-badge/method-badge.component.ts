import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpMethodStyleService } from '../../services/http-method-style.service';

/**
 * Reusable badge for HTTP methods.
 */
@Component({
  selector: 'app-method-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './method-badge.component.html',
  styleUrl: './method-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MethodBadgeComponent {
  private readonly styleService = inject(HttpMethodStyleService);

  /** HTTP method (GET, POST, PUT, PATCH, DELETE) */
  readonly method = input.required<string>();

  /** Show full label (e.g., "DELETE" instead of "DEL") */
  readonly showFullLabel = input<boolean>(false);

  /** Size variant */
  readonly size = input<'sm' | 'md'>('sm');

  /** Additional CSS classes */
  readonly additionalClasses = input<string>('');

  /** Computed badge classes based on method */
  protected readonly badgeClasses = computed(() => {
    const base = this.styleService.getMethodClass(this.method());
    const sizeClasses =
      this.size() === 'sm'
        ? 'px-1.5 py-0.5 text-[10px]'
        : 'px-2 py-1 text-xs';
    return `${sizeClasses} rounded font-medium ${base} ${this.additionalClasses()}`;
  });

  /** Computed label based on showFullLabel flag */
  protected readonly label = computed(() => {
    return this.showFullLabel()
      ? this.styleService.getLabelFull(this.method())
      : this.styleService.getLabel(this.method());
  });
}
