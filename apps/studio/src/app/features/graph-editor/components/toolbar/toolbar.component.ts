import { PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
	lucideFocus,
	lucideRedo,
	lucideUndo,
	lucideZoomIn,
	lucideZoomOut,
} from '@ng-icons/lucide';
import { MmcButton, MmcDivider, MmcIcon } from '@forge/ui';
import { GraphEditorComponent } from '../../graph-editor.component';

export enum EToolbarAction {
	FIT_TO_SCREEN = 'FIT_TO_SCREEN',
	ZOOM_IN = 'ZOOM_IN',
	ZOOM_OUT = 'ZOOM_OUT',
	UNDO = 'UNDO',
	REDO = 'REDO',
	ARRANGE = 'ARRANGE',
}

@Component({
	selector: 'mmc-toolbar',
	standalone: true,
	templateUrl: './toolbar.component.html',
	styleUrl: './toolbar.component.scss',
	imports: [PercentPipe, MmcButton, MmcDivider, MmcIcon],
	viewProviders: [
		provideIcons({
			lucideZoomIn,
			lucideZoomOut,
			lucideUndo,
			lucideRedo,
			lucideFocus,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		role: 'toolbar',
	},
})
export class ToolbarComponent {
	private readonly flowCmp = inject(GraphEditorComponent);

	get zoom(): number {
		return this.flowCmp.vFlowComponent().viewport().zoom;
	}

	protected eAction: typeof EToolbarAction = EToolbarAction;

	protected onActionClick(action: EToolbarAction): void {
		switch (action) {
			case EToolbarAction.UNDO:
				// TODO: Implement undo functionality
				break;
			case EToolbarAction.REDO:
				// TODO: Implement redo functionality
				break;
			case EToolbarAction.ZOOM_IN:
				this.flowCmp.zoomIn();
				break;
			case EToolbarAction.ZOOM_OUT:
				this.flowCmp.zoomOut();
				break;
			case EToolbarAction.FIT_TO_SCREEN:
				this.flowCmp.fitScreen();
				break;
			case EToolbarAction.ARRANGE: {
				// TODO: Implement arrange nodes
				break;
			}
		}
	}
}
