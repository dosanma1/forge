import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { MmcButton, MmcIcon, MmcInput, MmcLabel } from '@forge/ui';
import { ProjectService } from '../project.service';

// Service frameworks and deployment options (from forge-cli)
type ServiceFramework = 'go' | 'nestjs';
type ServiceDeployer = 'helm' | 'cloudrun';

// App frameworks and deployment options
type AppFramework = 'angular' | 'nextjs';
type AppDeployer = 'firebase' | 'helm' | 'cloudrun';

// Library languages
type LibraryLanguage = 'go' | 'typescript';

interface ServiceItem {
  id: number;
  name: string;
  framework: ServiceFramework;
  deployer: ServiceDeployer;
}

interface AppItem {
  id: number;
  name: string;
  framework: AppFramework;
  deployer: AppDeployer;
}

interface LibraryItem {
  id: number;
  name: string;
  language: LibraryLanguage;
}

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MmcButton,
    MmcInput,
    MmcLabel,
    MmcIcon,
  ],
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucidePlus,
      lucideTrash2,
    }),
  ],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.scss',
})
export class CreateProjectComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  readonly projectService = inject(ProjectService);

  projectForm: FormGroup;
  submitted = false;

  // Separate signals for each project type
  readonly services = signal<ServiceItem[]>([]);
  readonly apps = signal<AppItem[]>([]);
  readonly libraries = signal<LibraryItem[]>([]);

  private nextId = 1;

  constructor() {
    this.projectForm = this.formBuilder.group({
      name: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    const suggestedName = this.projectService.getSuggestedName();
    if (suggestedName) {
      this.projectForm.patchValue({ name: suggestedName });
    }

    if (!this.projectService.pendingProjectPath()) {
      this.router.navigate(['/projects']);
    }
  }

  get f() {
    return this.projectForm.controls;
  }

  // Service methods
  addService(): void {
    this.services.update((list) => [
      ...list,
      { id: this.nextId++, name: '', framework: 'go', deployer: 'helm' },
    ]);
  }

  removeService(index: number): void {
    this.services.update((list) => list.filter((_, i) => i !== index));
  }

  updateServiceName(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.services.update((list) =>
      list.map((item, i) => (i === index ? { ...item, name: value } : item))
    );
  }

  updateServiceFramework(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ServiceFramework;
    this.services.update((list) =>
      list.map((item, i) => (i === index ? { ...item, framework: value } : item))
    );
  }

  updateServiceDeployer(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ServiceDeployer;
    this.services.update((list) =>
      list.map((item, i) => (i === index ? { ...item, deployer: value } : item))
    );
  }

  // App methods
  addApp(): void {
    this.apps.update((list) => [
      ...list,
      { id: this.nextId++, name: '', framework: 'angular', deployer: 'firebase' },
    ]);
  }

  removeApp(index: number): void {
    this.apps.update((list) => list.filter((_, i) => i !== index));
  }

  updateAppName(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.apps.update((list) =>
      list.map((item, i) => (i === index ? { ...item, name: value } : item))
    );
  }

  updateAppFramework(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AppFramework;
    this.apps.update((list) =>
      list.map((item, i) => (i === index ? { ...item, framework: value } : item))
    );
  }

  updateAppDeployer(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AppDeployer;
    this.apps.update((list) =>
      list.map((item, i) => (i === index ? { ...item, deployer: value } : item))
    );
  }

  // Library methods
  addLibrary(): void {
    this.libraries.update((list) => [
      ...list,
      { id: this.nextId++, name: '', language: 'go' },
    ]);
  }

  removeLibrary(index: number): void {
    this.libraries.update((list) => list.filter((_, i) => i !== index));
  }

  updateLibraryName(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.libraries.update((list) =>
      list.map((item, i) => (i === index ? { ...item, name: value } : item))
    );
  }

  updateLibraryLanguage(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as LibraryLanguage;
    this.libraries.update((list) =>
      list.map((item, i) => (i === index ? { ...item, language: value } : item))
    );
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.projectForm.invalid) {
      return;
    }

    const { name } = this.projectForm.value;

    // Combine all project types into InitialProject format
    const initialProjects = [
      ...this.services()
        .filter((s) => s.name.trim() !== '')
        .map((s) => ({
          name: s.name,
          projectType: 'service',
          language: s.framework,
          deployer: s.deployer,
        })),
      ...this.apps()
        .filter((a) => a.name.trim() !== '')
        .map((a) => ({
          name: a.name,
          projectType: 'application',
          language: a.framework,
          deployer: a.deployer,
        })),
      ...this.libraries()
        .filter((l) => l.name.trim() !== '')
        .map((l) => ({
          name: l.name,
          projectType: 'library',
          language: l.language,
          deployer: '',
        })),
    ];

    this.projectService.createFromPendingPath(name, initialProjects);
  }

  onCancel(): void {
    this.projectService.clearPendingPath();
    this.router.navigate(['/projects']);
  }
}
