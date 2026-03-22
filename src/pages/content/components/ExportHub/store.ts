import { useSyncExternalStore } from 'react';

class ExportStore {
  private listeners = new Set<() => void>();
  public isSelectionMode = false;
  public selectedIds = new Set<string>();
  
  // React 18 strictly demands a brand new memory reference (immutable snapshot) to trigger repaints!
  private snapshot = { isSelectionMode: false, selectedIds: new Set<string>() };

  setIsSelectionMode(val: boolean) {
    this.isSelectionMode = val;
    if (!val) {
      this.selectedIds.clear();
    }
    this.updateSnapshot();
  }

  toggleId(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.updateSnapshot();
  }

  toggleBulk(type: 'user' | 'assistant' | 'all') {
    const allNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-test-render-count]'));
    let anyUnselected = false;
    const targetIds: string[] = [];

    allNodes.forEach(node => {
      const isUser = !!node.querySelector('[data-testid="user-message"]');
      const id = node.getAttribute('data-cherry-id');
      if (!id) return;
      
      if (type === 'all' || (type === 'user' && isUser) || (type === 'assistant' && !isUser)) {
        targetIds.push(id);
        if (!this.selectedIds.has(id)) {
           anyUnselected = true;
        }
      }
    });

    if (anyUnselected) {
      targetIds.forEach(id => this.selectedIds.add(id));
    } else {
      targetIds.forEach(id => this.selectedIds.delete(id));
    }
    
    this.updateSnapshot();
  }

  private updateSnapshot() {
    this.snapshot = {
      isSelectionMode: this.isSelectionMode,
      selectedIds: new Set(this.selectedIds) // Deep copy guarantees pointer mutation!
    };
    this.listeners.forEach((l) => l());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;
}

export const exportStore = new ExportStore();

export function useExportStore() {
  return useSyncExternalStore(exportStore.subscribe, exportStore.getSnapshot);
}
