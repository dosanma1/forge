import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IProject, Project } from '../../core/models/project.model';
import { MenuRoute } from '../../core/navigation/navigation-menu';
import { LogService } from '@forge/log';
import { LOCAL_STORAGE } from '@forge/storage';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { take } from 'rxjs';

const LAST_PROJECT_KEY = 'forge_last_project_path';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly logger = inject(LogService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly localStorage = inject(LOCAL_STORAGE);
  private readonly apiService = inject(ApiService);

  // State signals
  readonly projects = signal<IProject[]>([]);
  readonly selectedResource = signal<IProject | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Returns the last opened project path from localStorage
   */
  getLastProjectPath(): string | null {
    return this.localStorage?.getItem(LAST_PROJECT_KEY) ?? null;
  }

  /**
   * Saves the project path to localStorage as the last opened project
   */
  private saveLastProjectPath(path: string): void {
    this.localStorage?.setItem(LAST_PROJECT_KEY, path);
  }

  /**
   * Clears the last opened project from localStorage
   */
  clearLastProject(): void {
    this.localStorage?.removeItem(LAST_PROJECT_KEY);
  }

  /**
   * List recent projects from the backend using JSON API
   */
  list(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService
      .list(Project)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.projects.set(response.result());
        },
        error: (err) => {
          this.logger.error('Failed to list projects', err);
          this.error.set(err.message || 'Failed to load projects');
          this.isLoading.set(false);
        },
        complete: () => this.isLoading.set(false),
      });
  }

  /**
   * Create a new project using JSON API
   */
  create(name: string, path: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    const newProject = new Project({
      name,
      path,
      description: '',
    });

    this.apiService
      .post(newProject)
      .pipe(take(1))
      .subscribe({
        next: (createdProject) => {
          this.projects.update((projects) => [createdProject, ...projects]);
          this.setSelectedResource(createdProject);
          this.saveLastProjectPath(path);
          this.router.navigate([MenuRoute.DASHBOARD]);
        },
        error: (err) => {
          this.logger.error('Failed to create project', err);
          this.error.set(err.error?.errors?.[0]?.detail || err.message || 'Failed to create project');
          this.isLoading.set(false);
        },
        complete: () => this.isLoading.set(false),
      });
  }

  /**
   * Open an existing project by path
   * Note: This uses a custom endpoint, not standard JSON API
   */
  open(path: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .post<IProject>(`${environment.url}/projects/open`, { path })
      .pipe(take(1))
      .subscribe({
        next: () => {
          // Refresh the list to get the updated project info
          this.list();
          this.saveLastProjectPath(path);
        },
        error: (err) => {
          this.logger.error('Failed to open project', err);
          this.error.set(err.error?.errors?.[0]?.detail || err.message || 'Failed to open project');
          this.isLoading.set(false);
        },
        complete: () => this.isLoading.set(false),
      });
  }

  /**
   * Set the selected project and navigate to dashboard
   */
  setSelectedResource(project: IProject | null): void {
    this.selectedResource.set(project);
    if (project) {
      this.saveLastProjectPath(project.ID());
    }
  }

  /**
   * Switch to a different project
   */
  switchProject(project: IProject): void {
    this.setSelectedResource(project);
    this.router.navigate([MenuRoute.DASHBOARD]);
  }

  /**
   * Get project by path (from local list)
   */
  getProjectByPath(path: string): IProject | undefined {
    return this.projects().find((p) => p.ID() === path);
  }

  /**
   * Initialize by trying to restore the last opened project
   */
  initializeLastProject(): void {
    const lastPath = this.getLastProjectPath();
    if (lastPath) {
      const project = this.getProjectByPath(lastPath);
      if (project) {
        this.setSelectedResource(project);
      }
    }
  }
}
