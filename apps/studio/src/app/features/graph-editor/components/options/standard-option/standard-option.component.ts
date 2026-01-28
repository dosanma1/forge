import { Component, input } from '@angular/core';
import { Option } from '../../../models';
import { HandleComponent, Vflow } from 'ngx-vflow';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import { HandlerComponent } from '../../handler/handler.component';

@Component({
  selector: 'mmc-standard-option',
  templateUrl: './standard-option.component.html',
  styleUrl: './standard-option.component.scss',
  standalone: true,
  imports: [Vflow, HandleComponent, HandlerComponent],
  viewProviders: [provideIcons({ lucideArrowRight })],
  host: {
    class: 'contents',
  },
})
export class StandardOptionComponent {
  readonly id = input.required<number>();
  readonly nodeId = input.required<string>();
  readonly option = input.required<Option>();

  get handlerID(): string {
    return `option-${this.id()}-${this.nodeId()}`;
  }
}
