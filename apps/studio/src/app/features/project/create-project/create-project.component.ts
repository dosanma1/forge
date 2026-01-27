import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';
import { MmcButton, MmcIcon, MmcInput, MmcLabel } from '@forge/ui';
import { ProjectService } from '../project.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MmcButton,
    MmcInput,
    MmcLabel,
    MmcIcon,
  ],
  providers: [
    provideIcons({
      lucideChevronLeft,
    }),
  ],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.scss',
})
export class CreateProjectComponent {
  private formBuilder = inject(FormBuilder);

  readonly projectService = inject(ProjectService);

  projectForm: FormGroup;
  submitted = false;

  constructor() {
    this.projectForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      path: ['', [Validators.required]],
    });
  }

  get f() {
    return this.projectForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.projectForm.invalid) {
      return;
    }

    const { name, path } = this.projectForm.value;
    this.projectService.create(name, path);
  }
}
