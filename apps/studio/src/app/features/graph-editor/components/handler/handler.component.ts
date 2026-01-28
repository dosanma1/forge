import {
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'mmc-handler',
  templateUrl: './handler.component.html',
  styleUrls: ['./handler.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
})
export class HandlerComponent {
  public readonly x = input<number>(0);
  public readonly y = input<number>(0);

  public readonly templateRef = viewChild(TemplateRef);
}
