import { Document, ProjectState, AppState } from '../types';

export interface StorageData {
  projects: ProjectState[];
  activeProjectId: string | null;
  lastSaved: string;
  version: string;
}

export class PersistentStorageService {
  private static instance: PersistentStorageService;
  private readonly STORAGE_KEY = 'sentient-core-v4-data';
  private readonly VERSION = '1.0.0';
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): PersistentStorageService {
    if (!PersistentStorageService.instance) {
      PersistentStorageService.instance = new PersistentStorageService();
    }
    return PersistentStorageService.instance;
  }

  /**
   * Save app state to localStorage with error handling
   */
  async saveAppState(appState: AppState): Promise<{ success: boolean; error?: string }> {
    try {
      const storageData: StorageData = {
        projects: appState.projects,
        activeProjectId: appState.activeProjectId,
        lastSaved: new Date().toISOString(),
        version: this.VERSION
      };

      const serializedData = JSON.stringify(storageData, null, 2);
      
      // Check if data size is reasonable (< 5MB)
      if (serializedData.length > 5 * 1024 * 1024) {
        return {
          success: false,
          error: 'Data size exceeds 5MB limit. Consider cleaning up old documents.'
        };
      }

      localStorage.setItem(this.STORAGE_KEY, serializedData);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save app state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error'
      };
    }
  }

  /**
   * Load app state from localStorage with error handling
   */
  async loadAppState(): Promise<{ success: boolean; data?: Partial<AppState>; error?: string }> {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (!storedData) {
        return { success: true, data: {} }; // No data stored yet
      }

      const parsedData: StorageData = JSON.parse(storedData);
      
      // Version compatibility check
      if (parsedData.version !== this.VERSION) {
        console.warn(`Storage version mismatch. Expected ${this.VERSION}, got ${parsedData.version}`);
        // Could implement migration logic here
      }

      return {
        success: true,
        data: {
          projects: parsedData.projects || [],
          activeProjectId: parsedData.activeProjectId || null
        }
      };
    } catch (error) {
      console.error('Failed to load app state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse stored data'
      };
    }
  }

  /**
   * Debounced save to prevent excessive localStorage writes
   */
  debouncedSave(appState: AppState, delay: number = 1000): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      const result = await this.saveAppState(appState);
      if (!result.success) {
        console.error('Auto-save failed:', result.error);
      }
    }, delay);
  }

  /**
   * Export documents with error handling
   */
  async exportDocuments(
    documents: Document[], 
    format: 'json' | 'zip'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!documents || documents.length === 0) {
        return {
          success: false,
          error: 'No documents to export'
        };
      }

      if (format === 'json') {
        return await this.exportAsJson(documents);
      } else if (format === 'zip') {
        return await this.exportAsZip(documents);
      } else {
        return {
          success: false,
          error: 'Unsupported export format'
        };
      }
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export operation failed'
      };
    }
  }

  /**
   * Export documents as JSON
   */
  private async exportAsJson(documents: Document[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { saveAs } = await import('file-saver');
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: this.VERSION,
        documentCount: documents.length,
        documents: documents.map(doc => ({
          id: doc.id,
          nodeId: doc.nodeId,
          title: doc.title,
          content: doc.content,
          outline: doc.outline,
          synthesis: doc.synthesis,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          category: doc.category,
          tags: doc.tags,
          metadata: doc.metadata
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json;charset=utf-8'
      });

      const filename = `sentient-documents-${new Date().toISOString().split('T')[0]}.json`;
      saveAs(blob, filename);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON export failed'
      };
    }
  }

  /**
   * Export documents as ZIP containing individual Markdown files
   */
  private async exportAsZip(documents: Document[]): Promise<{ success: boolean; error?: string }> {
    try {
      const [{ saveAs }, JSZip] = await Promise.all([
        import('file-saver'),
        import('jszip')
      ]);

      const zip = new JSZip.default();

      // Add each document as a markdown file
      documents.forEach((doc, index) => {
        const filename = `${String(index + 1).padStart(2, '0')}-${doc.title.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
        
        let markdownContent = `# ${doc.title}\n\n`;
        
        if (doc.outline) {
          markdownContent += `## Outline\n\n${doc.outline}\n\n`;
        }
        
        if (doc.synthesis) {
          markdownContent += `## Synthesis\n\n${doc.synthesis}\n\n`;
        }
        
        if (doc.content) {
          markdownContent += `## Content\n\n${doc.content}\n\n`;
        }
        
        markdownContent += `---\n\n`;
        markdownContent += `**Created:** ${doc.createdAt}\n`;
        markdownContent += `**Updated:** ${doc.updatedAt}\n`;
        markdownContent += `**Category:** ${doc.category}\n`;
        
        if (doc.tags && doc.tags.length > 0) {
          markdownContent += `**Tags:** ${doc.tags.join(', ')}\n`;
        }

        zip.file(filename, markdownContent);
      });

      // Add a README file
      const readmeContent = `# Sentient Core Documents Export

This archive contains ${documents.length} documents exported from Sentient Core v4.

**Export Date:** ${new Date().toISOString()}
**Export Format:** Markdown files in ZIP archive

## File Structure

Each document is saved as a separate Markdown file with the following structure:
- Title as H1 heading
- Outline section (if available)
- Synthesis section (if available) 
- Content section (if available)
- Metadata footer with creation date, update date, category, and tags

## Usage

You can open these Markdown files in any text editor or Markdown viewer.
For best results, use a Markdown editor that supports:
- Mermaid diagrams
- Syntax highlighting
- Table rendering
`;

      zip.file('README.md', readmeContent);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `sentient-documents-${new Date().toISOString().split('T')[0]}.zip`;
      
      saveAs(zipBlob, filename);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ZIP export failed'
      };
    }
  }

  /**
   * Clear all stored data with optional backup
   */
  async clearStorage(createBackup: boolean = false): Promise<{ success: boolean; backupData?: string; error?: string }> {
    try {
      let backupData: string | undefined;
      
      if (createBackup) {
        const storedData = localStorage.getItem(this.STORAGE_KEY);
        if (storedData) {
          backupData = storedData;
        }
      }
      
      localStorage.removeItem(this.STORAGE_KEY);
      
      return {
        success: true,
        backupData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear storage'
      };
    }
  }

  /**
   * Reset all application data with confirmation
   */
  async resetAllData(options: {
    createBackup?: boolean;
    clearApiKeys?: boolean;
    clearUserPreferences?: boolean;
  } = {}): Promise<{ success: boolean; backupData?: string; error?: string }> {
    try {
      const { createBackup = true, clearApiKeys = false, clearUserPreferences = false } = options;
      let backupData: any = {};
      
      if (createBackup) {
        // Create comprehensive backup
        backupData = {
          sentientCore: localStorage.getItem(this.STORAGE_KEY),
          apiKey: clearApiKeys ? null : localStorage.getItem('gemini_api_key'),
          userPrefs: clearUserPreferences ? null : localStorage.getItem('appState_v2'),
          timestamp: new Date().toISOString(),
          version: this.VERSION
        };
      }
      
      // Clear main application data
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('appState_v2');
      
      if (clearApiKeys) {
        localStorage.removeItem('gemini_api_key');
      }
      
      if (clearUserPreferences) {
        // Clear any other user preference keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('user_') || key.startsWith('pref_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      return {
        success: true,
        backupData: createBackup ? JSON.stringify(backupData, null, 2) : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset application data'
      };
    }
  }

  /**
   * Restore data from backup
   */
  async restoreFromBackup(backupData: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backup = JSON.parse(backupData);
      
      if (backup.sentientCore) {
        localStorage.setItem(this.STORAGE_KEY, backup.sentientCore);
      }
      
      if (backup.apiKey) {
        localStorage.setItem('gemini_api_key', backup.apiKey);
      }
      
      if (backup.userPrefs) {
        localStorage.setItem('appState_v2', backup.userPrefs);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore from backup'
      };
    }
  }

  /**
   * Reset storage
   */
  async resetStorage(): Promise<{ success: boolean; error?: string }> {
    try {
      localStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Failed to reset storage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown reset error' 
      };
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const used = data ? new Blob([data]).size : 0;
      const available = 5 * 1024 * 1024; // 5MB typical localStorage limit
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}

export default PersistentStorageService;
