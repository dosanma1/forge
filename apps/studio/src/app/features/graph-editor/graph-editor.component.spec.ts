import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphEditorComponent, GraphNode, GraphEdge } from './graph-editor.component';

describe('GraphEditorComponent', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inputs', () => {
    it('should default graphNodes to empty array', () => {
      expect(component.graphNodes()).toEqual([]);
    });

    it('should default graphEdges to empty array', () => {
      expect(component.graphEdges()).toEqual([]);
    });
  });

  describe('selectedItems', () => {
    it('should return null when nothing selected', () => {
      expect(component.selectedItems()).toBeNull();
    });

    it('should return selected nodes and edges', () => {
      component['selectedNodes'].set(['node-1']);
      expect(component.selectedItems()).toEqual({
        nodes: ['node-1'],
        edges: [],
      });
    });
  });

  describe('handleNodeSelection', () => {
    it('should update selectedNodes with selected node ids', () => {
      const changes = [
        { id: 'node-1', selected: true },
        { id: 'node-2', selected: false },
      ];
      component.handleNodeSelection(changes as any);
      expect(component['selectedNodes']()).toEqual(['node-1']);
    });

    it('should emit nodeSelected event', () => {
      const spy = jest.spyOn(component.nodeSelected, 'emit');
      component.handleNodeSelection([{ id: 'node-1', selected: true }] as any);
      expect(spy).toHaveBeenCalledWith('node-1');
    });
  });

  describe('handleEdgeSelection', () => {
    it('should update selectedEdges with selected edge ids', () => {
      const changes = [
        { id: 'edge-1', selected: true },
        { id: 'edge-2', selected: true },
      ];
      component.handleEdgeSelection(changes as any);
      expect(component['selectedEdges']()).toEqual(['edge-1', 'edge-2']);
    });
  });

  describe('allowDrop', () => {
    it('should always return true', () => {
      expect(component.allowDrop()).toBe(true);
    });
  });
});
