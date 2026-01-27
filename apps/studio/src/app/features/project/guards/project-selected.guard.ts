import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { MenuRoute } from '../../../core/navigation/navigation-menu';
import { ProjectService } from '../project.service';

/**
 * Guard that checks if a project is selected.
 * If no project is selected, it attempts to restore from localStorage.
 * If no last project exists, it redirects to the projects page.
 */
export const projectSelectedGuard: CanActivateChildFn = (): boolean | UrlTree => {
  const projectService = inject(ProjectService);
  const router = inject(Router);

  const selectedProject = projectService.selectedResource();

  if (selectedProject) {
    return true;
  }

  // Check if there's a last opened project path in localStorage
  const lastProjectPath = projectService.getLastProjectPath();

  if (lastProjectPath) {
    // Try to restore from local project list
    const project = projectService.getProjectByPath(lastProjectPath);
    if (project) {
      projectService.setSelectedResource(project);
      return true;
    }
  }

  // No project selected - redirect to projects page
  return router.createUrlTree([MenuRoute.PROJECTS]);
};
