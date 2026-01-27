import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
	standalone: true,
	template: `
		<h1>First Tab</h1>
		<p>This is the content of the first tab</p>
	`,
})
class FirstStoryContentComponent {}

@Component({
	standalone: true,
	template: `
		<h1>Second Tab</h1>
		<p>This is the content of the second tab</p>
	`,
})
class SecondStoryContentComponent {}

export const routes: Routes = [
	{
		path: 'tab1',
		loadComponent: () => FirstStoryContentComponent,
	},
	{
		path: 'tab2',
		loadComponent: () => SecondStoryContentComponent,
	},
	{
		path: '**',
		redirectTo: 'tab1',
		pathMatch: 'full',
	},
];
