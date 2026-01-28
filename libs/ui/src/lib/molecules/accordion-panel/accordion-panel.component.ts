import { NgTemplateOutlet } from '@angular/common';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  CdkDragPreview,
  CdkDragPlaceholder,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideChevronRight } from '@ng-icons/lucide';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcAccordionSection } from './accordion-section.component';

export interface AccordionSectionToggle {
  id: string;
  expanded: boolean;
}

export interface AccordionSectionReorder {
  previousIndex: number;
  currentIndex: number;
  sectionIds: string[];
}

@Component({
  selector: 'mmc-accordion-panel',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MmcIcon,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    CdkDragPlaceholder,
  ],
  providers: [provideIcons({ lucideChevronDown, lucideChevronRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classNames()',
  },
  template: `
    <div
      cdkDropList
      [cdkDropListData]="orderedSections()"
      (cdkDropListDropped)="onDrop($event)"
      class="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      @for (
        section of orderedSections();
        track section.id();
        let i = $index;
        let isLast = $last
      ) {
        <div
          cdkDrag
          [cdkDragData]="section"
          class="flex flex-col min-h-0 relative shrink-0 overflow-hidden"
          [style.flex]="getSectionFlex(section)"
        >
          <!-- Drag Preview -->
          <div
            *cdkDragPreview
            class="flex items-center gap-1 h-[22px] px-2 text-[11px] font-semibold uppercase tracking-wide bg-sidebar border border-primary rounded shadow-lg"
          >
            <mmc-icon name="lucideChevronRight" class="w-3 h-3 shrink-0" />
            <span>{{ section.title() }}</span>
          </div>

          <!-- Drag Placeholder -->
          <div
            *cdkDragPlaceholder
            class="h-[22px] bg-primary/20 border-2 border-dashed border-primary rounded"
          ></div>

          <!-- Section Header - VSCode style compact -->
          <div class="flex-shrink-0 z-20 bg-sidebar border-b border-border/10">
            <button
              type="button"
              cdkDragHandle
              class="flex items-center gap-1 w-full h-[22px] px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground hover:bg-sidebar-accent focus:outline-none select-none cursor-grab active:cursor-grabbing"
              (click)="toggleSection(section)"
            >
              <mmc-icon
                name="lucideChevronRight"
                class="w-3 h-3 flex-shrink-0 transition-transform duration-200 ease-in-out"
                [class.rotate-90]="section.expanded()"
              />
              <span class="truncate">{{ section.title() }}</span>
            </button>
          </div>

          <!-- Section Content Wrapper -->
          <div
            class="flex-1 flex flex-col min-h-0 overflow-hidden transition-opacity duration-300 ease-in-out"
            [class.opacity-0]="!section.expanded()"
            [class.invisible]="!section.expanded()"
          >
            <div
              #sectionContent
              class="flex-1 overflow-auto min-h-0 relative"
              [attr.data-section-id]="section.id()"
            >
              <ng-container [ngTemplateOutlet]="section.templateRef()" />
            </div>
          </div>

          <!-- Resize handle -->
          @if (!isLast && hasExpandedSectionAfter(i)) {
            <div
              class="h-[1px] relative cursor-ns-resize bg-border hover:bg-primary/50 active:bg-primary flex-shrink-0 transition-colors z-30"
              (mousedown)="startResize($event, section.id())"
              [class.hidden]="!section.expanded()"
            >
              <div class="absolute inset-x-0 -top-1 -bottom-1"></div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MmcAccordionPanel {
  public readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });

  /** Whether multiple sections can be expanded at once */
  public readonly allowMultipleExpanded = input<boolean>(true);

  /** Emitted when a section is toggled */
  public readonly sectionToggle = output<AccordionSectionToggle>();

  /** Emitted when sections are reordered */
  public readonly sectionReorder = output<AccordionSectionReorder>();

  /** Child sections via content projection */
  public readonly sections = contentChildren(MmcAccordionSection);

  /** Section content element refs for resize calculations */
  protected readonly sectionContents =
    viewChildren<ElementRef>('sectionContent');

  /** Minimum section height in pixels */
  protected readonly minSectionHeight = 50;

  /** Order of section IDs (for reordering) */
  protected readonly sectionOrder = signal<string[]>([]);

  /** Flex values for each section by ID (default is 1 for equal distribution) */
  protected readonly sectionFlexValues = signal<Map<string, number>>(new Map());

  /** Currently resizing section ID */
  protected readonly isResizing = signal<boolean>(false);
  private resizingSectionId: string | null = null;
  private startY = 0;
  private startHeights = new Map<string, number>();

  constructor() {
    // Initialize section order when sections change
    effect(() => {
      const sections = this.sections();
      const currentOrder = this.sectionOrder();

      // Only initialize if order is empty or sections changed
      if (currentOrder.length === 0 && sections.length > 0) {
        this.sectionOrder.set(sections.map((s) => s.id()));
      } else if (sections.length !== currentOrder.length) {
        // Handle added/removed sections - keep existing order, add new ones at end
        const existingIds = new Set(currentOrder);
        const newOrder = [
          ...currentOrder.filter((id) => sections.some((s) => s.id() === id)),
        ];
        sections.forEach((s) => {
          if (!existingIds.has(s.id())) {
            newOrder.push(s.id());
          }
        });
        this.sectionOrder.set(newOrder);
      }
    });
  }

  /** Sections in the current order */
  protected readonly orderedSections = computed(() => {
    const sections = this.sections();
    const order = this.sectionOrder();

    if (order.length === 0) {
      return sections;
    }

    // Sort sections by order
    const sectionMap = new Map(sections.map((s) => [s.id(), s]));
    return order
      .map((id) => sectionMap.get(id))
      .filter((s): s is MmcAccordionSection => s !== undefined);
  });

  protected readonly classNames = computed(() =>
    cn(
      'flex flex-col flex-1 min-h-0 overflow-hidden',
      this.additionalClasses(),
    ),
  );

  /** Returns true if user has manually resized sections */
  protected hasFlexValues(): boolean {
    return this.sectionFlexValues().size > 0;
  }

  /** Get flex value for a section */
  protected getSectionFlex(section: MmcAccordionSection): string {
    // Collapsed sections don't flex and have a fixed height of 22px
    if (!section.expanded()) {
      return '0 0 22px';
    }

    const expandedSections = this.orderedSections().filter((s) => s.expanded());

    // If only one section is expanded, it must take all available space
    if (expandedSections.length === 1) {
      return '1 1 0%';
    }

    const flexValues = this.sectionFlexValues();

    // Get the flex value for this section
    const value = flexValues.get(section.id());
    if (value !== undefined) {
      // Weight, shrink, basis
      return `${value} 1 0%`;
    }

    // Default: expanded sections share space equally
    return '1 1 0%';
  }

  protected hasExpandedSectionAfter(index: number): boolean {
    const allSections = this.orderedSections();
    for (let i = index + 1; i < allSections.length; i++) {
      if (allSections[i].expanded()) {
        return true;
      }
    }
    return false;
  }

  /** Returns true if this section should grow to fill available space */
  protected shouldSectionGrow(sectionId: string): boolean {
    const section = this.sections().find((s) => s.id() === sectionId);
    if (!section?.expanded()) return false;

    // If we have manual flex values, it depends on those
    const flexValues = this.sectionFlexValues();
    if (flexValues.size > 0) {
      return flexValues.has(sectionId);
    }

    return true;
  }

  protected toggleSection(section: MmcAccordionSection): void {
    const newExpanded = !section.expanded();

    // If only one can be expanded, collapse others
    if (newExpanded && !this.allowMultipleExpanded()) {
      this.sections().forEach((s) => {
        if (s !== section && s.expanded()) {
          s.expanded.set(false);
          this.sectionToggle.emit({ id: s.id(), expanded: false });
        }
      });
    }

    section.expanded.set(newExpanded);
    this.sectionToggle.emit({ id: section.id(), expanded: newExpanded });
  }

  protected onDrop(event: CdkDragDrop<readonly MmcAccordionSection[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const newOrder = [...this.sectionOrder()];
    moveItemInArray(newOrder, event.previousIndex, event.currentIndex);
    this.sectionOrder.set(newOrder);

    this.sectionReorder.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      sectionIds: newOrder,
    });
  }

  protected startResize(event: MouseEvent, sectionId: string): void {
    event.preventDefault();
    event.stopPropagation(); // Prevent event bubbling
    this.resizingSectionId = sectionId;
    this.isResizing.set(true);
    this.startY = event.clientY;

    // Store current heights of all expanded sections
    this.startHeights.clear();
    const contents = this.sectionContents();
    contents.forEach((el) => {
      const id = el.nativeElement.getAttribute('data-section-id');
      if (id) {
        // We need the height of the whole section container, not just content
        const sectionContainer = el.nativeElement.closest('[cdkDrag]');
        if (sectionContainer) {
          this.startHeights.set(id, sectionContainer.offsetHeight);
        }
      }
    });

    // Initialize flex values based on current heights if not set or if sections changed
    const expandedSections = this.orderedSections().filter((s) => s.expanded());
    const totalAvailableHeight = Array.from(this.startHeights.values()).reduce(
      (a, b) => a + b,
      0,
    );

    if (totalAvailableHeight > 0) {
      const newFlexValues = new Map<string, number>();
      expandedSections.forEach((s) => {
        const height = this.startHeights.get(s.id()) || 0;
        // Use actual pixel heights as weights.
        // Flexbox will distribute based on these values.
        // Since they are > 1, the sum will always allow full filling.
        newFlexValues.set(s.id(), height);
      });
      this.sectionFlexValues.set(newFlexValues);
    }

    const onMouseMove = (e: MouseEvent) => this.onResize(e);
    const onMouseUp = () => {
      this.resizingSectionId = null;
      this.isResizing.set(false);
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseup', onMouseUp, true);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseup', onMouseUp, true);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }

  private onResize(event: MouseEvent): void {
    if (!this.resizingSectionId) return;

    const deltaY = event.clientY - this.startY;

    // Find the current and next expanded sections in the display order
    const expandedSections = this.orderedSections().filter((s) => s.expanded());
    const currentIndex = expandedSections.findIndex(
      (s) => s.id() === this.resizingSectionId,
    );

    if (currentIndex === -1 || currentIndex >= expandedSections.length - 1)
      return;

    const currentSection = expandedSections[currentIndex];
    const nextSection = expandedSections[currentIndex + 1];

    const currentStartHeight =
      this.startHeights.get(currentSection.id()) || 100;
    const nextStartHeight = this.startHeights.get(nextSection.id()) || 100;
    const combinedHeight = currentStartHeight + nextStartHeight;

    // VSCode specific: section header is usually 22px. Min content height can be 0 or small.
    const minHeight = 22 + 20; // Header + small buffer

    // Calculate new heights
    let newCurrentHeight = Math.max(minHeight, currentStartHeight + deltaY);
    let newNextHeight = Math.max(minHeight, nextStartHeight - deltaY);

    // Clamp to ensure they don't exceed combined height
    if (newCurrentHeight + newNextHeight !== combinedHeight) {
      if (newCurrentHeight === minHeight) {
        newNextHeight = combinedHeight - minHeight;
      } else if (newNextHeight === minHeight) {
        newCurrentHeight = combinedHeight - minHeight;
      }
    }

    // Update flex values proportional to new heights
    const newFlexValues = new Map(this.sectionFlexValues());
    newFlexValues.set(currentSection.id(), newCurrentHeight);
    newFlexValues.set(nextSection.id(), newNextHeight);

    this.sectionFlexValues.set(newFlexValues);
  }
}
