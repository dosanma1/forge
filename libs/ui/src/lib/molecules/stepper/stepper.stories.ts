import { provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideLoaderCircle } from '@ng-icons/lucide';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcStepper } from './stepper.component';

const meta: Meta<MmcStepper> = {
    title: 'Molecules/Stepper',
    component: MmcStepper,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [MmcStepper],
            providers: [
                provideIcons({
                    lucideCheck,
                    lucideLoaderCircle,
                }),
            ],
        }),
    ],
    argTypes: {
        currentStep: { control: 'number' },
        loading: { control: 'boolean' },
        showNavigation: { control: 'boolean' },
    },
};

export default meta;
type Story = StoryObj<MmcStepper>;

const steps = [
    { id: '1', title: 'Personal Info', description: 'Enter your details' },
    { id: '2', title: 'Account Info', description: 'Setup your account' },
    { id: '3', title: 'Confirmation', description: 'Review and submit' },
];

export const Default: Story = {
    args: {
        steps: steps,
        currentStep: 0,
        loading: false,
        showNavigation: true,
    },
    render: (args) => ({
        props: args,
        template: `
            <mmc-stepper
                [steps]="steps"
                [currentStep]="currentStep"
                [loading]="loading"
                [showNavigation]="showNavigation"
                (stepChange)="currentStep = $event"
            >
                <ng-template let-step="step" let-index="index">
                    <div class="p-4 border rounded mt-4">
                        <h3 class="font-bold">Step {{index + 1}}: {{step.title}}</h3>
                        <p>{{step.description}}</p>
                        <div class="mt-4">
                            Step content goes here...
                        </div>
                    </div>
                </ng-template>
            </mmc-stepper>
        `,
    }),
};

export const Loading: Story = {
    args: {
        steps: steps,
        currentStep: 1,
        loading: true,
        showNavigation: true,
    },
    render: (args) => ({
        props: args,
        template: `
            <mmc-stepper
                [steps]="steps"
                [currentStep]="currentStep"
                [loading]="loading"
                [showNavigation]="showNavigation"
                (stepChange)="currentStep = $event"
            >
                <ng-template let-step="step" let-index="index">
                    <div class="p-4 border rounded mt-4">
                        <h3 class="font-bold">Step {{index + 1}}: {{step.title}}</h3>
                        <p>Processing...</p>
                    </div>
                </ng-template>
            </mmc-stepper>
        `,
    }),
};

export const Completed: Story = {
    args: {
        steps: steps.map(s => ({ ...s, completed: true })),
        currentStep: 2,
        loading: false,
        showNavigation: true,
    },
    render: (args) => ({
        props: args,
        template: `
            <mmc-stepper
                [steps]="steps"
                [currentStep]="currentStep"
                [loading]="loading"
                [showNavigation]="showNavigation"
                (stepChange)="currentStep = $event"
            >
                <ng-template let-step="step" let-index="index">
                    <div class="p-4 border rounded mt-4">
                        <h3 class="font-bold">Step {{index + 1}}: {{step.title}}</h3>
                        <p>All done!</p>
                    </div>
                </ng-template>
            </mmc-stepper>
        `,
    }),
};
