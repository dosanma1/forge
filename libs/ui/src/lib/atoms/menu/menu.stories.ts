import { Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcButton } from '../button/button.component';
import { MmcCheckbox } from '../checkbox/checkbox.component';
import { MmcIcon } from '../icon/icon.component';
import { MmcContextMenuTrigger } from './context-menu-trigger.directive';
import { MmcMenuGroup } from './menu-group.directive';
import { MmcMenuItemCheckbox } from './menu-item-checkbox.directive';
import { MmcMenuItemIndicator } from './menu-item-indicator.component';
import { MmcMenuItemRadio } from './menu-item-radio.directive';
import { MmcMenuItem } from './menu-item.directive';
import { MmcMenuTrigger } from './menu-trigger.directive';
import { MmcMenu } from './menu.directive';

@Component({
    selector: 'mmc-menu-story',
    template: `
        <button
            mmcButton
            variant="ghost"
            size="sm"
           [mmcContextMenuTriggerFor]="menu"
        >
        <div
            class="flex justify-start items-center gap-x-1"
        >
            Right-click me!
        </div>
        </button>
        
        <button
            mmcButton
            variant="ghost"
            size="sm"
            [mmcMenuTriggerFor]="menu"
        >
        <div
            class="flex justify-start items-center gap-x-1"
        >
            Click me!
        </div>
        </button>

       <ng-template #menu>
            <div class="w-56" mmcMenu>
                <div role="group">
                    <button
                        mmcMenuItem
                    >
                        <p>Settings</p>
                    </button>
                </div>
                <div role="group">
                    <button
                        mmcMenuItem
                        class="justify-start"
                    >
                        <p>Download desktop app</p>
                    </button>
                    <button
                        mmcMenuItem
                        [mmcMenuTriggerFor]="menu2"
                        class="justify-between"
                    >
                        <p>Switch workspace</p>
                        <i class="inline-flex">
                            <mmc-icon size="sm" name="lucideChevronRight" />
                        </i>
                    </button>
                </div>
                <div>
                    <button
                        mmcMenuItem
                        [mmcMenuTriggerFor]="menu3"
                        class="justify-between"
                    >
                        <p>Format</p>
                        <i class="inline-flex">
                            <mmc-icon size="sm" name="lucideChevronRight" />
                        </i>
                    </button>
                </div>
                <div>
                    <button
                        mmcMenuItem
                        [mmcMenuTriggerFor]="menu4"
                        class="justify-between"
                    >
                        <p>Column visibility</p>
                        <i class="inline-flex">
                            <mmc-icon size="sm" name="lucideChevronRight" />
                        </i>
                    </button>
                </div>
                <div>
                    <button
                        mmcMenuItem
                    >
                        <p>Log out</p>
                    </button>
                </div>
            </div>
        </ng-template>

        <ng-template #menu2>
            <div class="w-56" mmcMenu>
                <div role="group">
                    <button
                        mmcMenuItem
                        class="justify-start"
                    >
                        <p>Create or join a workspace</p>
                    </button>
                </div>
            </div>
        </ng-template>

        <ng-template #menu3>
             <div class="w-56" mmcMenu>
                <div role="group" mmcMenuGroup>
                    <button
                        mmcMenuItemRadio
                        class="justify-start"
                    >
                        <p>Small</p>
                    </button>
                    <button
                        mmcMenuItemRadio
                        [selected]="true"
                        class="justify-start"
                    >   
                        <span
                            mmcMenuItemIndicator
                            [show]="true"
                        ></span>
                        <p>Normal</p>
                    </button>
                    <button
                        mmcMenuItemRadio
                        class="justify-start"
                    >
                        <p>Big</p>
                    </button>
                </div>
            </div>
        </ng-template>

        <ng-template #menu4>
            <div class="w-64" mmcMenu>
                <div role="group">
                    <div class="px-3 py-2">
                        <h4 class="text-sm font-semibold">
                            Toggle columns
                        </h4>
                    </div>
                    <div 
                        mmcMenuItemCheckbox
                        class="gap-2"
                        [checked]="columns().name"
                        (click)="toggleColumn('name')"
                    >
                        <mmc-checkbox 
                            [checked]="columns().name"
                            (click)="$event.stopPropagation()"
                        ></mmc-checkbox>
                        <span class="text-sm">Name</span>
                    </div>
                    <div 
                        mmcMenuItemCheckbox
                        class="gap-2"
                        [checked]="columns().email"
                        (click)="toggleColumn('email')"
                    >
                        <mmc-checkbox 
                            [checked]="columns().email"
                            (click)="$event.stopPropagation()"
                        ></mmc-checkbox>
                        <span class="text-sm">Email</span>
                    </div>
                    <div 
                        mmcMenuItemCheckbox
                        class="gap-2"
                        [checked]="columns().location"
                        (click)="toggleColumn('location')"
                    >
                        <mmc-checkbox 
                            [checked]="columns().location"
                            (click)="$event.stopPropagation()"
                        ></mmc-checkbox>
                        <span class="text-sm">Location</span>
                    </div>
                    <div 
                        mmcMenuItemCheckbox
                        class="gap-2"
                        [checked]="columns().balance"
                        (click)="toggleColumn('balance')"
                    >
                        <mmc-checkbox 
                            [checked]="columns().balance"
                            (click)="$event.stopPropagation()"
                        ></mmc-checkbox>
                        <span class="text-sm">Balance</span>
                    </div>
                </div>
            </div>
        </ng-template>
    `,
    imports: [
        MmcMenu,
        MmcMenuItem,
        MmcMenuItemRadio,
        MmcMenuItemCheckbox,
        MmcMenuItemIndicator,
        MmcMenuGroup,
        MmcMenuTrigger,
        MmcContextMenuTrigger,
        MmcButton,
        MmcCheckbox,
        MmcIcon,
    ],
})
class MenuStoryComponent {
    columns = signal({
        name: true,
        email: true,
        location: false,
        balance: true,
    });

    toggleColumn(column: 'name' | 'email' | 'location' | 'balance') {
        this.columns.update(cols => ({
            ...cols,
            [column]: !cols[column]
        }));
    }
}

const meta: Meta<MenuStoryComponent> = {
    title: 'Atoms/Menu',
    component: MenuStoryComponent,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [MenuStoryComponent],
            providers: [provideIcons({ lucideChevronRight })],
        }),
    ],
};

export default meta;
type Story = StoryObj<MenuStoryComponent>;

export const Default: Story = {};
