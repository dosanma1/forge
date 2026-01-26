import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    input,
    signal
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
    lucideArrowRight,
    lucideArrowUpRight,
    lucideCalendar,
    lucideCheck,
    lucideChevronDown,
    lucideChevronsUpDown,
    lucideGitMerge,
    lucideMail,
    lucidePlus,
    lucideZap
} from '@ng-icons/lucide';
import { MmcAvatar } from '../../atoms/avatar/avatar.component';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';

export type ActivityType =
    | 'status_change'
    | 'email'
    | 'attribute_change'
    | 'add_to_list'
    | 'merge'
    | 'calendar_event'
    | 'expandable_group';

export interface ActivityUser {
    name: string;
    avatarUrl?: string;
}

export interface ActivityItem {
    id: string;
    type: ActivityType;
    timestamp: string;
    user?: ActivityUser;
    users?: ActivityUser[];
    title?: string;
    description?: string;
    meta?: {
        label?: string;
        value?: string;
        badge?: string;
        badgeColor?: 'default' | 'secondary' | 'destructive' | 'outline';
        count?: number;
    };
    icon?: string; // Override default icon
    iconColor?: string; // Tailwind class for icon color
    collapsedItems?: ActivityItem[]; // For expandable group
    attributeChanges?: Array<{ attribute: string; oldValue: string; newValue: string }>; // For attribute_change type
}


export interface ActivityGroup {
    title: string;
    items: ActivityItem[];
}

@Component({
    selector: 'mmc-activity-timeline',
    standalone: true,
    imports: [CommonModule, MmcIcon, MmcAvatar, MmcButton],
    viewProviders: [
        provideIcons({
            lucideZap,
            lucideArrowUpRight,
            lucideMail,
            lucidePlus,
            lucideGitMerge,
            lucideCalendar,
            lucideChevronDown,
            lucideCheck,
            lucideArrowRight,
            lucideChevronsUpDown
        }),
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
		<div class="flex flex-col gap-6">
			@for (group of groups(); track group.title) {
				<div class="flex flex-col">
					<!-- Group Header -->
                    <h3 class="text-lg font-semibold text-foreground">{{ group.title }}</h3>

					<!-- Items -->
					<div class="flex flex-col relative">
                        <!-- Vertical Line -->
                        <div class="absolute left-3 top-0 bottom-0 w-px bg-border/50"></div>

						@for (item of group.items; track item.id; let i = $index; let last = $last) {
                            @if (item.type === 'expandable_group' && expandedItems().has(item.id)) {
                                <!-- Expanded Items -->
                                @for (subItem of item.collapsedItems; track subItem.id) {
                                    <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: subItem }"></ng-container>
                                }
                            } @else {
                                <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item, isNextExpandable: group.items[i + 1]?.type === 'expandable_group' && !expandedItems().has(group.items[i + 1].id) }"></ng-container>
                            }
						}
					</div>
				</div>
			}
		</div>

        <ng-template #itemTemplate let-item let-isNextExpandable="isNextExpandable">
            @if (item.type === 'expandable_group') {
                <div class="flex gap-4 relative py-2 group ml-8">
                     <!-- Curved Branch -->
                    <div class="absolute -left-5 -top-4 w-5 h-8 border-b border-l border-border/50 rounded-bl-xl"></div>

                    <button mmcButton variant="ghost" size="sm" class="h-auto p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent font-medium" (click)="toggleGroup(item.id)">
                        <mmc-icon name="lucideChevronsUpDown" class="size-4 mr-1" />
                        @if (expandedItems().has(item.id)) {
                            Hide {{ item.collapsedItems?.length || 0 }} items
                        } @else {
                            Show {{ item.collapsedItems?.length || 0 }} more items
                        }
                    </button>
                </div>
            } @else {
                <div class="flex gap-4 relative py-3 group">
                    <!-- Icon Column -->
                    <div class="relative z-10 flex flex-col items-center shrink-0">
                        <div class="flex items-center justify-center size-6 rounded-full bg-background border border-border shadow-sm">
                            @switch (item.type) {
                                @case ('status_change') {
                                    <mmc-icon name="lucideZap" class="size-3 text-yellow-500 fill-yellow-500" />
                                }
                                @case ('email') {
                                    <mmc-icon name="lucideArrowUpRight" class="size-3 text-blue-500" />
                                }
                                @case ('attribute_change') {
                                    <mmc-icon name="lucideZap" class="size-3 text-purple-500 fill-purple-500" />
                                }
                                @case ('add_to_list') {
                                    <mmc-icon name="lucidePlus" class="size-3 text-pink-500" />
                                }
                                @case ('merge') {
                                    <mmc-icon name="lucideGitMerge" class="size-3 text-purple-500" />
                                }
                                @case ('calendar_event') {
                                    <mmc-icon name="lucideCalendar" class="size-3 text-blue-500" />
                                }
                            }
                        </div>
                    </div>

                    <!-- Content Column -->
                    <div class="flex-1 min-w-0 pt-0.5" [class.pb-4]="isNextExpandable">
                        @switch (item.type) {
                            @case ('status_change') {
                                <div class="flex items-center gap-2 text-sm">
                                    @if(item.user){
                                    <mmc-avatar class="size-5 text-[10px]">
                                        @if (item.user.avatarUrl) {
                                            <img [src]="item.user.avatarUrl" [alt]="item.user.name" />
                                        }
                                        @if (!item.user.avatarUrl) {
                                            <span>{{ item.user.name.charAt(0) }}</span>
                                        }
                                    </mmc-avatar>
                                    }
                                    <span class="font-medium text-foreground">{{ item.user?.name }}</span>
                                    <span class="text-muted-foreground">has changed Status to</span>
                                    <div class="flex items-center gap-1 text-emerald-600 font-medium">
                                        <div class="size-1.5 rounded-full bg-emerald-600"></div>
                                        {{ item.meta?.value }}
                                    </div>
                                    <span class="text-muted-foreground ml-auto sm:ml-0">{{ item.timestamp }}</span>
                                </div>
                            }
                            @case ('email') {
                                <div class="rounded-lg border border-border bg-card p-4 shadow-sm relative z-10">
                                    <div class="font-medium text-foreground mb-1">{{ item.title }}</div>
                                    <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <div class="flex -space-x-2">
                                            @for (u of item.users; track u.name) {
                                                <mmc-avatar class="size-5 ring-2 ring-background text-[10px]">
                                                    @if (u.avatarUrl) {
                                                        <img [src]="u.avatarUrl" [alt]="u.name" />
                                                    }
                                                    @if (!u.avatarUrl) {
                                                        <span>{{ u.name.charAt(0) }}</span>
                                                    }
                                                </mmc-avatar>
                                            }
                                        </div>
                                        <span class="text-foreground font-medium">
                                            {{ item.users?.[0]?.name }}{{ (item.users?.length || 0) > 1 ? ', ' + item.users?.[1]?.name : '' }}
                                        </span>
                                        <span>{{ item.timestamp }}</span>
                                    </div>
                                    <p class="text-sm text-muted-foreground line-clamp-2">{{ item.description }}</p>
                                </div>
                                <!-- Stacked Effect -->
                                @if (isNextExpandable) {
                                    <div class="absolute bottom-2 left-2 right-2 h-4 bg-card border border-border rounded-b-lg shadow-sm -z-10"></div>
                                    <div class="absolute bottom-0 left-4 right-4 h-4 bg-card border border-border rounded-b-lg shadow-sm -z-20"></div>
                                }
                            }
                            @case ('attribute_change') {
                                <div class="flex flex-col gap-2">
                                    <div class="flex items-center gap-2 text-sm cursor-pointer" (click)="toggleAttributeExpansion(item.id)">
                                        @if (item.user) {
                                        <mmc-avatar class="size-5 text-[10px]">
                                            @if (item.user.avatarUrl) {
                                                <img [src]="item.user.avatarUrl" [alt]="item.user.name" />
                                            }
                                            @if (!item.user.avatarUrl) {
                                                <span>{{ item.user.name.charAt(0) }}</span>
                                            }
                                        </mmc-avatar>
                                        }
                                        <span class="font-medium text-foreground">{{ item.user?.name }}</span>
                                        <span class="text-muted-foreground">has changed</span>
                                        <span class="font-medium text-foreground">{{ item.meta?.count }} attributes</span>
                                        <mmc-icon 
                                            name="lucideChevronDown" 
                                            class="size-3 text-muted-foreground transition-transform"
                                            [class.rotate-180]="expandedAttributes().has(item.id)"
                                        />
                                        <span class="text-muted-foreground ml-auto sm:ml-0">{{ item.timestamp }}</span>
                                    </div>
                                    @if (expandedAttributes().has(item.id) && item.attributeChanges) {
                                        <div class="ml-7 flex flex-col gap-1 text-sm">
                                            @for (change of item.attributeChanges; track change.attribute) {
                                                <div class="flex items-center gap-2 text-muted-foreground">
                                                    <span class="font-medium text-foreground">{{ change.attribute }}:</span>
                                                    <span class="line-through">{{ change.oldValue }}</span>
                                                    <mmc-icon name="lucideArrowRight" class="size-3" />
                                                    <span class="text-foreground">{{ change.newValue }}</span>
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            }
                            @case ('add_to_list') {
                                <div class="flex items-center gap-2 text-sm">
                                    <div class="flex items-center justify-center size-5 rounded bg-purple-100 text-purple-600">
                                        <mmc-icon name="lucideZap" class="size-3 fill-current" />
                                    </div>
                                    <span class="font-medium text-foreground">Gamma</span>
                                    <span class="text-muted-foreground">was added to</span>
                                    <span class="font-medium text-foreground">Sales</span>
                                    <span class="text-muted-foreground ml-auto sm:ml-0">{{ item.timestamp }}</span>
                                </div>
                            }
                            @case ('merge') {
                                <div class="flex items-center gap-2 text-sm">
                                    <div class="flex items-center justify-center size-5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">1</div>
                                    <span class="text-muted-foreground">1 duplicate was merged with</span>
                                    <span class="font-medium text-foreground">Gamma</span>
                                    <span class="text-muted-foreground ml-auto sm:ml-0">{{ item.timestamp }}</span>
                                </div>
                            }
                            @case ('calendar_event') {
                                <div class="rounded-lg border border-border bg-card p-0 overflow-hidden shadow-sm flex relative z-10">
                                    <div class="w-16 flex flex-col items-center justify-center bg-muted/30 border-r border-border p-2">
                                        <span class="text-[10px] font-bold text-red-500 uppercase">Sep</span>
                                        <span class="text-xl font-semibold text-foreground">05</span>
                                    </div>
                                    <div class="flex-1 p-3 flex items-center justify-between">
                                        <div>
                                            <div class="font-medium text-foreground">{{ item.title }}</div>
                                            <div class="text-sm text-muted-foreground">{{ item.timestamp }}</div>
                                        </div>
                                        <div class="flex -space-x-2">
                                                @for (u of item.users; track u.name) {
                                                <div class="size-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] ring-2 ring-background">
                                                    {{ u.name.substring(0, 2).toUpperCase() }}
                                                </div>
                                            }
                                            @if (item.meta?.count) {
                                                <div class="size-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] ring-2 ring-background">
                                                    +{{ item.meta?.count }}
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                                 <!-- Stacked Effect -->
                                @if (isNextExpandable) {
                                    <div class="absolute bottom-2 left-2 right-2 h-4 bg-card border border-border rounded-b-lg shadow-sm -z-10"></div>
                                    <div class="absolute bottom-0 left-4 right-4 h-4 bg-card border border-border rounded-b-lg shadow-sm -z-20"></div>
                                }
                            }
                        }
                    </div>
                </div>
            }
        </ng-template>
	`,
})
export class MmcActivityTimeline {
    readonly groups = input<ActivityGroup[]>([]);
    readonly expandedItems = signal<Set<string>>(new Set());
    readonly expandedAttributes = signal<Set<string>>(new Set());

    protected toggleGroup(id: string): void {
        this.expandedItems.update((current) => {
            const newSet = new Set(current);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    protected toggleAttributeExpansion(id: string): void {
        this.expandedAttributes.update((current) => {
            const newSet = new Set(current);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }
}
