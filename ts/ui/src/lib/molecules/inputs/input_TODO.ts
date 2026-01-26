// import { provideIcons } from '@ng-icons/core';
// import { lucideCircleHelp, lucideMail } from '@ng-icons/lucide';
// import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
// import { MmcButton } from '../../atoms/button/button.component';
// import { IconComponent } from '../../atoms/icon/icon.component';
// import { InputDirective } from '../../atoms/input/input.directive';
// import { MmcLabel } from '../../atoms/label/label.directive';

// const emailPlaceholder = 'you@example.com';

// const meta: Meta<InputDirective> = {
// 	title: 'Molecules/Input',
// 	component: InputDirective,
// 	tags: ['autodocs'],
// 	decorators: [
// 		moduleMetadata({
// 			imports: [MmcLabel, InputDirective, MmcButton, IconComponent],
// 			providers: [provideIcons({ lucideMail, lucideCircleHelp })],
// 		}),
// 	],
// };

// export default meta;
// type Story = StoryObj<InputDirective>;

// export const Default: Story = {
// 	name: 'Input with label',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 			<div>
// 				<label mmcLabel for="email">Email</label>
// 				<input mmcInput id="email" type="email" placeholder="${emailPlaceholder}"/>
// 			</div>
// 			`,
// 	}),
// };

// export const WithHelperText: Story = {
// 	name: 'Input with label and text',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 			<div>
// 				<label mmcLabel for="email">Email</label>
// 				<input mmcInput id="email" type="email" placeholder="${emailPlaceholder}"/>
// 				<p class="text-muted-foreground mt-1 text-xs" role="region" aria-live="polite">
// 					We won&lsquo;t share your email with anyone
// 				</p>
// 			</div>
// 		`,
// 	}),
// };

// export const WithError: Story = {
// 	name: 'Input with validation error',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 			<div>
// 				<label mmcLabel for="email">Email</label>
// 				<div class="grid grid-cols-1">
// 					<input mmcInput id="email" type="email" placeholder="${emailPlaceholder}" [error]="true" class="col-start-1 row-start-1 pr-10" aria-invalid="true" aria-describedby="email-error"/>
// 					<svg class="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-destructive sm:size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" data-slot="icon">
// 						<path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
// 					</svg>
// 				</div>
// 				<p
// 					class="text-destructive mt-1 text-xs"
// 				>
// 					Email is invalid
// 				</p>
// 			</div>
// 		`,
// 	}),
// };

// export const Disabled: Story = {
// 	name: 'Input with disabled state',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 			<div>
// 				<label mmcLabel for="email">Email</label>
// 				<input disabled mmcInput type='email' placeholder='${emailPlaceholder}'/>
// 			</div>
// 		`,
// 	}),
// };

// export const WithCornerHint: Story = {
// 	name: 'Input with corner hint',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 		<div>
// 			<div class="flex items-center justify-between gap-1">
// 				<label mmcLabel for="email">Email</label>
// 				<span class="text-muted-foreground text-sm" id="email-optional">Optional</span>
// 			</div>
// 			<div>
// 				<input mmcInput id="email" type='email' placeholder='${emailPlaceholder}' aria-describedby="email-optional"/>
// 			</div>
// 		</div>
// 		`,
// 	}),
// };

// export const WithLeadingIcon: Story = {
// 	name: 'Input with leading icon',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 		<div>
// 			<label mmcLabel for="email">Email</label>
// 			<div class="grid grid-cols-1">
// 				<input mmcInput id="email" type='email' placeholder='${emailPlaceholder}' class="col-start-1 row-start-1 ps-9"/>
// 				<mmc-icon name="lucideMail" size="sm" class="pointer-events-none col-start-1 row-start-1 ml-3 self-center text-muted-foreground/80"></mmc-icon>
// 			</div>
// 		</div>
// 		`,
// 	}),
// };

// export const WithTrailingIcon: Story = {
// 	name: 'Input with trailing icon',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 		<div>
// 			<label mmcLabel for="account-number">Account number</label>
// 			<div class="grid grid-cols-1">
// 				<input mmcInput id="account-number" type='text' placeholder="000-00-0000" class="col-start-1 row-start-1 pr-10"/>
// 				<mmc-icon name="lucideCircleHelp" size="sm" class="pointer-events-none col-start-1 row-start-1 mr-3 self-center justify-self-end text-muted-foreground/80"></mmc-icon>
// 			</div>
// 		</div>
// 		`,
// 	}),
// };

// export const WithAddOn: Story = {
// 	name: 'Input with add-on',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 		<div>
// 			<label mmcLabel for="company-website">Company website</label>
// 			<div class="flex rounded-md shadow-xs">
// 				<span class="border-input bg-background text-muted-foreground -z-10 inline-flex items-center rounded-s-md border px-3 text-sm">
// 					https://
// 				</span>
// 				<input mmcInput id="company-website" type='text' placeholder="www.payemoji.com" class="-ms-px rounded-s-none shadow-none"/>
// 			</div>
// 		</div>
// 		`,
// 	}),
// };

// export const WithInlineAddOn: Story = {
// 	name: 'Input with inline add-on',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 		<div>
// 			<label mmcLabel for="email">Email</label>
// 			<div class="grid grid-cols-1">
// 				<input mmcInput id="email" type='email' placeholder='${emailPlaceholder}' class="col-start-1 row-start-1 ps-14"/>
// 				<div class="pointer-events-none col-start-1 row-start-1 ml-3 self-center text-muted-foreground text-sm">https://</div>
// 			</div>
// 		</div>
// 		`,
// 	}),
// };

// export const File: Story = {
// 	name: 'File input',
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 			<div class="grid w-full max-w-sm items-center gap-1.5">
// 				<label mmcLabel for="picture">File</label>
// 				<input mmcInput id="picture" variant="file" type="file" class="p-0 pe-3 file:me-3 file:border-0 file:border-e"/>
// 			</div>
// 		`,
// 	}),
// };
