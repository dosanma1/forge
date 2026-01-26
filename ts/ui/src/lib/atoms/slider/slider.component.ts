import { Component, computed, effect, input } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { ClassValue } from 'clsx';
import {
    injectSliderState,
    NgpSlider,
    NgpSliderRange,
    NgpSliderThumb,
    NgpSliderTrack,
} from 'ng-primitives/slider';
import { ChangeFn, provideValueAccessor, TouchedFn } from 'ng-primitives/utils';
import { cn } from '../../../helpers/cn';

@Component({
    selector: 'mmc-slider',
    template: `
		<div ngpSliderTrack class="relative h-1.5 w-full rounded-full bg-secondary">
			<div ngpSliderRange class="absolute h-full rounded-full bg-primary"></div>
			<div 
				ngpSliderThumb
				class="absolute block size-4 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 -translate-x-1/2 -translate-y-1/2 top-1/2"
			></div>
		</div>
	`,
    hostDirectives: [
        {
            directive: NgpSlider,
            inputs: [
                'ngpSliderMin:min',
                'ngpSliderMax:max',
                'ngpSliderStep:step',
                'ngpSliderDisabled:disabled',
                'ngpSliderOrientation:orientation',
            ],
            outputs: ['ngpSliderValueChange:valueChange'],
        },
    ],
    imports: [NgpSliderThumb, NgpSliderTrack, NgpSliderRange],
    providers: [provideValueAccessor(MmcSlider)],
    host: {
        '[class]': 'hostClassNames()',
        '(focusout)': 'onTouched?.()',
    },
})
export class MmcSlider implements ControlValueAccessor {
    readonly additionalClasses = input<ClassValue>('', {
        alias: 'class',
    });
    readonly min = input<number>(0);
    readonly max = input<number>(100);
    readonly step = input<number>(1);

    protected readonly state = injectSliderState();
    protected onTouched?: TouchedFn;
    private onChange?: ChangeFn<number>;

    protected readonly hostClassNames = computed(() =>
        cn(
            'relative flex w-full touch-none select-none items-center h-5',
            this.additionalClasses(),
        ),
    );

    constructor() {
        // Set defaults immediately
        this.state().min.set(this.min());
        this.state().max.set(this.max());
        this.state().step.set(this.step());

        // Update if inputs change
        effect(() => {
            this.state().min.set(this.min());
            this.state().max.set(this.max());
            this.state().step.set(this.step());
        });

        // Round value to nearest step
        this.state().valueChange.subscribe((value) => {
            const step = this.state().step();
            const min = this.state().min();
            const max = this.state().max();

            // Calculate the rounded value to the nearest step
            const steps = Math.round((value - min) / step);
            const roundedValue = Math.max(min, Math.min(max, min + steps * step));

            // Update state with rounded value if different
            if (value !== roundedValue) {
                this.state().value.set(roundedValue);
            }

            if (this.onChange) {
                this.onChange(roundedValue);
            }
        });
    }

    writeValue(value: number): void {
        if (typeof value === 'number') {
            this.state().value.set(value);
        }
    }

    registerOnChange(onChange: ChangeFn<number>): void {
        this.onChange = onChange;
    }

    registerOnTouched(onTouched: TouchedFn): void {
        this.onTouched = onTouched;
    }

    setDisabledState(isDisabled: boolean): void {
        this.state().disabled.set(isDisabled);
    }
}
