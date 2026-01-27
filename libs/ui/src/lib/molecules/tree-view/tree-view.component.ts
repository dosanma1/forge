import { ArrayDataSource } from '@angular/cdk/collections';
import { CdkTree, CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	input,
	linkedSignal,
	output,
	viewChild,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';

export interface TreeNode {
	expandable: boolean;
	name: string;
	level: number;
	isExpanded?: boolean;
	icon: string;
	expandedIcon?: string;
	id?: string; // Add id for selection tracking
}

@Component({
	selector: 'mmc-tree-view',
	templateUrl: './tree-view.component.html',
	styleUrls: ['./tree-view.component.scss'],
	imports: [CommonModule, CdkTreeModule, MmcButton, MmcIcon],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcTree {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly data = input.required<TreeNode[]>();
	readonly selectedNodeId = input<string | undefined>(undefined);
	readonly nodeClick = output<TreeNode>();

	protected readonly tree = viewChild<CdkTree<TreeNode>>(CdkTree);

	protected classNames = computed(() => cn('', this.additionalClasses()));

	protected dataSource = linkedSignal(
		() => new ArrayDataSource<TreeNode>(this.data()),
	);

	protected levelAccessor = (dataNode: TreeNode): number => dataNode.level;

	protected hasChild = (_: number, node: TreeNode): boolean =>
		node.expandable;

	constructor() {
		// Effect to handle initial expansion when tree data changes
		effect(() => {
			const data = this.data();
			const tree = this.tree();

			if (tree && data.length > 0) {
				// Use setTimeout to ensure the tree is fully rendered
				setTimeout(() => {
					data.forEach((node) => {
						if (node.isExpanded && node.expandable) {
							tree.expand(node);
						}
					});
				}, 0);
			}
		});
	}

	protected getParentNode(node: TreeNode): TreeNode | null {
		const nodeIndex = this.data().indexOf(node);

		// Determine the node's parent by finding the first preceding node that's
		// one level shallower.
		for (let i = nodeIndex - 1; i >= 0; i--) {
			if (this.data()[i].level === node.level - 1) {
				return this.data()[i];
			}
		}

		return null;
	}

	protected shouldRender(node: TreeNode): boolean {
		// This node should render if it is a root node or if all of its ancestors are expanded.
		const parent = this.getParentNode(node);
		return (
			!parent ||
			(!!this.tree()?.isExpanded(parent) && this.shouldRender(parent))
		);
	}

	protected onNodeClick(node: TreeNode): void {
		this.nodeClick.emit(node);
	}

	protected isNodeSelected(node: TreeNode): boolean {
		return node.id === this.selectedNodeId();
	}

	protected isNodeOrChildSelected(node: TreeNode): boolean {
		// Check if this node is directly selected
		if (this.isNodeSelected(node)) {
			return true;
		}

		// Check if any child node is selected (for parent highlighting)
		const selectedId = this.selectedNodeId();
		if (!selectedId || !node.expandable) {
			return false;
		}

		// Find all child nodes of this node
		const nodeIndex = this.data().indexOf(node);
		const nodeLevel = node.level;

		// Look for children (nodes with level = nodeLevel + 1) that come after this node
		for (let i = nodeIndex + 1; i < this.data().length; i++) {
			const currentNode = this.data()[i];

			// If we encounter a node at the same level or higher, we've passed all children
			if (currentNode.level <= nodeLevel) {
				break;
			}

			// If this is a direct child (level + 1) and it's selected, highlight the parent
			if (
				currentNode.level === nodeLevel + 1 &&
				currentNode.id === selectedId
			) {
				return true;
			}
		}

		return false;
	}
}
