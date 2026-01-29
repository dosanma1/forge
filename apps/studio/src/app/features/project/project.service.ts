import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IProject } from '../../core/models/project.model';
import { MenuRoute } from '../../core/navigation/navigation-menu';
import { LogService } from '@forge/log';
import { LOCAL_STORAGE } from '@forge/storage';
import * as WailsProject from '../../wailsjs/github.com/dosanma1/forge/apps/studio/projectservice';
import {
  Project as WailsProjectModel,
  InitialProject,
} from '../../wailsjs/github.com/dosanma1/forge/apps/studio/models';

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
  readonly isGitRepo = signal<boolean>(false);
  readonly currentBranch = signal<string>('');
  readonly availableBranches = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Pending path for create-project flow
  private readonly _pendingProjectPath = signal<string | null>(null);
  readonly pendingProjectPath = this._pendingProjectPath.asReadonly();

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
  async create(name: string, path: string, initialProjects: InitialProject[] = []): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const wailsProject = await WailsProject.CreateProject(name, path, initialProjects);
      if (wailsProject) {
        const project = new ProjectAdapter(wailsProject);
        this.projects.update((projects) => [project, ...projects]);
        this.setSelectedResource(project);
        this.saveLastProjectPath(path);
        this._pendingProjectPath.set(null);
        this.router.navigate([MenuRoute.ARCHITECTURE]);
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
   * Open folder first flow: opens native dialog, checks for forge.json,
   * and either opens project or navigates to create-project
   */
  async openOrCreateProject(): Promise<void> {
    const path = await this.selectDirectory();
    if (!path) return;

    try {
      const isForgeProject = await WailsProject.CheckForgeProject(path);

      if (isForgeProject) {
        await this.open(path);
        this.router.navigate([MenuRoute.ARCHITECTURE]);
      } else {
        // Store path and navigate to create-project
        this._pendingProjectPath.set(path);
        this.router.navigate(['/projects/join']);
      }
    } catch (err: unknown) {
      this.logger.error('Failed to check project', err);
      // On error, try to create a new project anyway
      this._pendingProjectPath.set(path);
      this.router.navigate(['/projects/join']);
    }
  }

  /**
   * Get suggested project name from the pending path
   */
  getSuggestedName(): string {
    const path = this._pendingProjectPath();
    if (!path) return '';
    return path.split('/').pop() || '';
  }

  /**
   * Create project from the pending path
   */
  async createFromPendingPath(name: string, initialProjects: InitialProject[] = []): Promise<void> {
    const path = this._pendingProjectPath();
    if (!path) {
      this.error.set('No project path selected');
      return;
    }
    await this.create(name, path, initialProjects);
  }

  /**
   * Clear the pending project path
   */
  clearPendingPath(): void {
    this._pendingProjectPath.set(null);
  }

  /**
   * Get current git branch and list all branches for the selected project
   */
  async refreshGitBranch(): Promise<void> {
    const project = this.selectedResource();
    if (!project) {
      this.isGitRepo.set(false);
      this.currentBranch.set('');
      this.availableBranches.set([]);
      return;
    }

    try {
      const [gitRepo, branch, branches] = await Promise.all([
        WailsProject.IsGitRepo(project.path),
        WailsProject.GetGitBranch(project.path),
        WailsProject.ListGitBranches(project.path),
      ]);
      this.isGitRepo.set(gitRepo);
      this.currentBranch.set(branch || '');
      this.availableBranches.set(branches || []);
    } catch (err: unknown) {
      this.logger.error('Failed to get git branch info', err);
      this.isGitRepo.set(false);
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
   * Initialize a git repository in the current project
   */
  async initGitRepo(): Promise<void> {
    const project = this.selectedResource();
    if (!project) {
      return;
    }

    try {
      await WailsProject.InitGitRepo(project.path);
      await this.refreshGitBranch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize repository';
      this.logger.error('Failed to init git repo', err);
      this.error.set(message);
    }
  }

  /**
   * Create a new git branch and switch to it
   */
  async createGitBranch(branchName: string): Promise<void> {
    const project = this.selectedResource();
    if (!project) {
      return;
    }

    try {
      await WailsProject.CreateGitBranch(project.path, branchName);
      this.currentBranch.set(branchName);
      this.availableBranches.update(branches => [...branches, branchName]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create branch';
      this.logger.error('Failed to create git branch', err);
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
      this.isGitRepo.set(false);
      this.currentBranch.set('');
      this.availableBranches.set([]);
    }
  }

  /**
   * Switch to a different project
   */
  switchProject(project: IProject): void {
    this.setSelectedResource(project);
    this.router.navigate([MenuRoute.ARCHITECTURE]);
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

  /**
   * Remove a project from the recent projects list (keeps files)
   */
  async removeProject(project: IProject): Promise<void> {
    try {
      await WailsProject.RemoveProject(project.path);
      this.handleProjectRemoved(project);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove project';
      this.logger.error('Failed to remove project', err);
      this.error.set(message);
    }
  }

  /**
   * Delete a project folder (moves to trash) and removes from recent list
   */
  async deleteProject(project: IProject): Promise<void> {
    try {
      await WailsProject.DeleteProject(project.path);
      this.handleProjectRemoved(project);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      this.logger.error('Failed to delete project', err);
      this.error.set(message);
    }
  }

  private handleProjectRemoved(project: IProject): void {
    // Update local state
    this.projects.update(projects => projects.filter(p => p.ID() !== project.ID()));
    // Clear selection if this was the selected project
    if (this.selectedResource()?.ID() === project.ID()) {
      this.setSelectedResource(null);
      this.clearLastProject();
    }
  }
}
