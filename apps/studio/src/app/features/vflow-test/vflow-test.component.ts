import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Edge, Vflow } from 'ngx-vflow';

@Component({
	selector: 'app-vflow-test',
	standalone: true,
	imports: [Vflow, RouterLink],
	template: `
		<div class="relative h-screen w-full">
			<a routerLink="/architecture" class="absolute left-4 top-4 z-10 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
				← Back to Architecture
			</a>
			<vflow
				[nodes]="nodes"
				[edges]="edges"
				[background]="{ type: 'dots', gap: 25, backgroundColor: '#f5f5f5' }"
			/>
		</div>
	`,
})
export class VflowTestComponent {
	nodes = [
		{
			id: '1',
			point: signal({ x: 100, y: 100 }),
			type: 'default' as const,
			text: signal('Node 1'),
		},
		{
			id: '2',
			point: signal({ x: 300, y: 100 }),
			type: 'default' as const,
			text: signal('Node 2'),
		},
		{
			id: '3',
			point: signal({ x: 200, y: 250 }),
			type: 'default' as const,
			text: signal('Node 3'),
		},
	];

	edges: Edge[] = [
		{
			id: '1-2',
			source: '1',
			target: '2',
		},
		{
			id: '2-3',
			source: '2',
			target: '3',
		},
	];
}
