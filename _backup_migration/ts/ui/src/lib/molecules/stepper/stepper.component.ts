import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
	type TemplateRef,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideLoaderCircle } from '@ng-icons/lucide';
import { type ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcSpinner } from '../../atoms/spinner/spinner.component';

export interface Step {
	id: string;
	title: string;
	description?: string;
	disabled?: boolean;
	completed?: boolean;
}

@Component({
	selector: 'mmc-stepper',
	imports: [NgTemplateOutlet, MmcIcon, MmcSpinner],
	viewProviders: [
		provideIcons({
			lucideCheck,
			lucideLoaderCircle,
		}),
	],
	templateUrl: './stepper.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcStepper {
	// Inputs
	readonly steps = input.required<Step[]>();
	readonly currentStep = input<number>(0);
	readonly loading = input<boolean>(false);
	readonly showNavigation = input<boolean>(true);
	readonly stepTemplate = input<TemplateRef<any> | null>(null);
	readonly class = input<ClassValue>('');

	// Outputs
	readonly stepChange = output<number>();
	readonly stepComplete = output<{ step: Step; index: number }>();
	readonly finish = output<void>();

	// Computed properties
	readonly containerClasses = computed(() => cn('w-full', this.class()));

	readonly isLastStep = computed(
		() => this.currentStep() === this.steps().length - 1,
	);

	readonly isCurrentStepDisabled = computed(() => {
		const current = this.steps()[this.currentStep()];
		return current?.disabled === true;
	});

	// Methods
	getStepClasses(index: number): string {
		const state = this.getStepState(index);
		return cn(
			'relative flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-200',
			{
				'bg-gray-200 text-gray-500': state === 'inactive',
				'bg-blue-600 text-white':
					state === 'active' ||
					state === 'completed' ||
					state === 'loading',
			},
		);
	}

	getSeparatorClasses(index: number): string {
		const currentCompleted = this.isStepCompleted(index);

		return cn(
			'm-0.5 h-0.5 flex-1 bg-gray-200 transition-all duration-200',
			{
				'bg-blue-600': currentCompleted,
			},
		);
	}

	buttonClasses(): string {
		return cn(
			'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
		);
	}

	getStepState(
		index: number,
	): 'inactive' | 'active' | 'completed' | 'loading' {
		if (this.isStepLoading(index)) return 'loading';
		if (this.isStepCompleted(index)) return 'completed';
		if (this.currentStep() === index) return 'active';
		return 'inactive';
	}

	isStepCompleted(index: number): boolean {
		const step = this.steps()[index];
		return step?.completed === true || index < this.currentStep();
	}

	isStepLoading(index: number): boolean {
		return this.loading() && this.currentStep() === index;
	}

	nextStep(): void {
		const current = this.currentStep();
		const steps = this.steps();

		if (current < steps.length - 1) {
			const nextIndex = current + 1;
			this.stepChange.emit(nextIndex);
		} else if (current === steps.length - 1) {
			// Last step - emit finish event
			this.finish.emit();
		}

		// Mark current step as completed
		this.stepComplete.emit({
			step: steps[current],
			index: current,
		});
	}

	previousStep(): void {
		const current = this.currentStep();
		if (current > 0) {
			this.stepChange.emit(current - 1);
		}
	}
}
