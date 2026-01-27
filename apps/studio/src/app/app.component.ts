import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogService } from '@forge/log';
import { NgxSonnerToaster } from 'ngx-sonner';
import { environment } from '../environments/environment';

@Component({
	selector: 'app-root',
	standalone: true,
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
	imports: [RouterOutlet, NgxSonnerToaster],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
	private readonly log = inject(LogService);

	constructor() {
		this.log.debug(`App has started in ${environment.name} mode`);
	}
}
