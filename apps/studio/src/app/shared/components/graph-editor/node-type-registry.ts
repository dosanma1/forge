import { InjectionToken, Type } from '@angular/core';

/**
 * Injection token for mapping node types to their component implementations.
 * Features that use the graph editor should provide this token to register
 * their node type components.
 *
 * Example usage in a feature:
 * ```typescript
 * providers: [
 *   {
 *     provide: NODE_TYPE_COMPONENTS,
 *     useValue: {
 *       service: ServiceNodeComponent,
 *       app: AppNodeComponent,
 *       library: LibraryNodeComponent,
 *     },
 *   },
 * ]
 * ```
 */
export const NODE_TYPE_COMPONENTS = new InjectionToken<
  Record<string, Type<unknown>>
>('NODE_TYPE_COMPONENTS');
