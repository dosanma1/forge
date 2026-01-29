import { Injectable, signal } from '@angular/core';
import { HttpTransport, HttpEndpoint, HttpMethod } from '../models/architecture-node.model';

export interface TransportSelection {
  nodeId: string;
  transportId: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransportEditorService {
  /** Currently selected transport for editing */
  readonly selectedTransport = signal<TransportSelection | null>(null);

  /** Select a transport for editing */
  selectTransport(nodeId: string, transportId: string): void {
    this.selectedTransport.set({ nodeId, transportId });
  }

  /** Clear transport selection */
  clearSelection(): void {
    this.selectedTransport.set(null);
  }

  /** Check if a transport is selected */
  isSelected(nodeId: string, transportId: string): boolean {
    const selection = this.selectedTransport();
    return selection?.nodeId === nodeId && selection?.transportId === transportId;
  }
}
