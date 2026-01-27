import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MmcButton, MmcIcon, MmcInput, MmcLabel } from 'ui';
import { GlobalService, RecentProject } from '../../core/services/global.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, MmcButton, MmcIcon, MmcInput, MmcLabel],
  template: `
    <div class="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-8">
      <div class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Left Column: Actions -->
        <div class="flex flex-col gap-8">
          <div>
            <h1 class="text-4xl font-light mb-2">
              Forge <span class="text-green-500 font-bold">Studio</span>
            </h1>
            <p class="text-zinc-400 text-lg">Architect your next masterpiece.</p>
          </div>

          <div class="flex flex-col gap-4">
            <h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wider">Start</h2>

            <button
              mmcButton
              variant="outline"
              class="justify-start gap-3 h-12 text-zinc-300 hover:text-white border-zinc-700 bg-zinc-800/50"
              (click)="createNew()"
            >
              <mmc-icon name="plus" class="w-5 h-5" />
              <span>New Project</span>
            </button>

            <button
              mmcButton
              variant="outline"
              class="justify-start gap-3 h-12 text-zinc-300 hover:text-white border-zinc-700 bg-zinc-800/50"
              (click)="openExisting()"
            >
              <mmc-icon name="folder-open" class="w-5 h-5" />
              <span>Open Project...</span>
            </button>

            <button
              mmcButton
              variant="ghost"
              class="justify-start gap-3 h-12 text-zinc-300"
              (click)="cloneRepo()"
            >
              <mmc-icon name="download" class="w-5 h-5" />
              <span>Clone Repository</span>
            </button>
          </div>
        </div>

        <!-- Right Column: Recent -->
        <div class="flex flex-col gap-4">
          <h2 class="text-sm font-medium text-zinc-500 uppercase tracking-wider">Recent</h2>

          <div class="flex flex-col gap-1">
            @for (project of recentProjects(); track project.path) {
              <button
                class="group flex flex-col items-start p-3 -mx-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
                (click)="openProject(project.path)"
              >
                <span
                  class="text-zinc-200 group-hover:text-green-400 font-medium transition-colors"
                >
                  {{ project.name }}
                </span>
                <span class="text-xs text-zinc-500 font-mono truncate w-full">
                  {{ project.path }}
                </span>
              </button>
            } @empty {
              <p class="text-zinc-600 italic py-4">No recent projects found.</p>
            }
          </div>
        </div>
      </div>

      <!-- Quick Hack Input Modal (Replace with proper Dialog later) -->
      @if (showInput()) {
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div class="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 class="text-xl font-bold mb-4">
              {{ inputMode() === 'create' ? 'Create Project' : 'Open Project' }}
            </h3>

            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label mmcLabel>Project Path</label>
                <input mmcInput [(ngModel)]="inputPath" placeholder="/Users/me/projects/my-app" />
              </div>

              @if (inputMode() === 'create') {
                <div class="flex flex-col gap-2">
                  <label mmcLabel>Project Name</label>
                  <input mmcInput [(ngModel)]="inputName" placeholder="my-app" />
                </div>
              }

              <div class="flex justify-end gap-3 mt-4">
                <button mmcButton variant="ghost" (click)="showInput.set(false)">Cancel</button>
                <button mmcButton (click)="submitInput()">
                  {{ inputMode() === 'create' ? 'Create' : 'Open' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class StartScreenComponent {
  private globalService = inject(GlobalService);

  recentProjects = signal<RecentProject[]>([]);

  // Modal State
  showInput = signal(false);
  inputMode = signal<'create' | 'open'>('open');
  inputPath = '';
  inputName = '';

  constructor() {
    this.loadRecent();
  }

  loadRecent() {
    this.globalService.listRecent().subscribe((projects) => {
      this.recentProjects.set(projects);
    });
  }

  createNew() {
    this.inputMode.set('create');
    this.inputPath = '';
    this.inputName = '';
    this.showInput.set(true);
  }

  openExisting() {
    this.inputMode.set('open');
    this.inputPath = '';
    this.showInput.set(true);
  }

  cloneRepo() {
    alert('Coming soon!');
  }

  openProject(path: string) {
    this.globalService.openProject(path).subscribe(() => {
      // TODO: Navigate to Dashboard
      alert('Opening project: ' + path);
    });
  }

  submitInput() {
    if (this.inputMode() === 'create') {
      this.globalService.createProject(this.inputPath, this.inputName).subscribe(() => {
        this.showInput.set(false);
        this.loadRecent();
      });
    } else {
      this.globalService.openProject(this.inputPath).subscribe(() => {
        this.showInput.set(false);
        this.loadRecent();
      });
    }
  }
}
