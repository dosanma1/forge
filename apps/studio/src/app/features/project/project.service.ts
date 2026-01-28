import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IProject } from '../../core/models/project.model';
import { MenuRoute } from '../../core/navigation/navigation-menu';
import { LogService } from '@forge/log';
import { LOCAL_STORAGE } from '@forge/storage';
import * as WailsProject from '../../wailsjs/github.com/dosanma1/forge/apps/studio/projectservice';
import { Project as WailsProjectModel } from '../../wailsjs/github.com/dosanma1/forge/apps/studio/models';

const LAST_PROJECT_KEY = 'forge_last_project_path';

/**
 * Adapter to convert Wails Project to IProject interface
 */
class ProjectAdapter implements IProject {
  constructor(private wailsProject: WailsProjectModel) {}

  ID(): string {
    return this.wailsProject.path;
  }

  Type(): string {
    return 'projects';
  }

  CreatedAt(): Date {
    return this.wailsProject.lastOpen ? new Date(this.wailsProject.lastOpen as unknown as string) : new Date();
  }

  UpdatedAt(): Date {
    return this.wailsProject.lastOpen ? new Date(this.wailsProject.lastOpen as unknown as string) : new Date();
  }

  DeletedAt(): Date | null {
    return null;
  }

  get id(): string {
    return this.wailsProject.id;
  }

  get name(): string {
    return this.wailsProject.name;
  }

  get description(): string {
    return this.wailsProject.description || '';
  }

  get imageURL(): string {
    return this.wailsProject.imageURL || '';
  }

  get path(): string {
    return this.wailsProject.path;
  }
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly logger = inject(LogService);
  private readonly router = inject(Router);
  private readonly localStorage = inject(LOCAL_STORAGE);

  // State signals
  readonly projects = signal<IProject[]>([]);
  readonly selectedResource = signal<IProject | null>(null);
  readonly currentBranch = signal<string>('');
  readonly availableBranches = signal<string[]>([]);
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
   * List recent projects using Wails bindings
   */
  async list(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const wailsProjects = await WailsProject.ListProjects();
      const projects = wailsProjects.map((p) => new ProjectAdapter(p));
      this.projects.set(projects);
      // After loading projects, try to restore the last opened project
      this.initializeLastProject();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      this.logger.error('Failed to list projects', err);
      this.error.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Create a new project using Wails bindings
   */
  async create(name: string, path: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const wailsProject = await WailsProject.CreateProject(name, path, '');
      if (wailsProject) {
        const project = new ProjectAdapter(wailsProject);
        this.projects.update((projects) => [project, ...projects]);
        this.setSelectedResource(project);
        this.saveLastProjectPath(path);
        this.router.navigate([MenuRoute.DASHBOARD]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      this.logger.error('Failed to create project', err);
      this.error.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Open an existing project by path using Wails bindings
   */
  async open(path: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const wailsProject = await WailsProject.OpenProject(path);
      if (wailsProject) {
        // Refresh the list to get the updated project info
        await this.list();
        this.saveLastProjectPath(path);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open project';
      this.logger.error('Failed to open project', err);
      this.error.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Open native directory picker using Wails bindings
   */
  async selectDirectory(): Promise<string | null> {
    try {
      return await WailsProject.SelectDirectory();
    } catch (err: unknown) {
      this.logger.error('Failed to open directory picker', err);
      return null;
    }
  }

  /**
   * Get current git branch and list all branches for the selected project
   */
  async refreshGitBranch(): Promise<void> {
    const project = this.selectedResource();
    if (!project) {
      this.currentBranch.set('');
      this.availableBranches.set([]);
      return;
    }

    try {
      const [branch, branches] = await Promise.all([
        WailsProject.GetGitBranch(project.path),
        WailsProject.ListGitBranches(project.path),
      ]);
      this.currentBranch.set(branch || '');
      this.availableBranches.set(branches || []);
    } catch (err: unknown) {
      this.logger.error('Failed to get git branch info', err);
      this.currentBranch.set('');
      this.availableBranches.set([]);
    }
  }

  /**
   * Switch to a different git branch
   */
  async switchGitBranch(branch: string): Promise<void> {
    const project = this.selectedResource();
    if (!project) {
      return;
    }

    try {
      await WailsProject.SwitchGitBranch(project.path, branch);
      this.currentBranch.set(branch);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to switch branch';
      this.logger.error('Failed to switch git branch', err);
      this.error.set(message);
    }
  }

  /**
   * Set the selected project and refresh git branch
   */
  setSelectedResource(project: IProject | null): void {
    this.selectedResource.set(project);
    if (project) {
      this.saveLastProjectPath(project.ID());
      this.refreshGitBranch();
    } else {
      this.currentBranch.set('');
      this.availableBranches.set([]);
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
