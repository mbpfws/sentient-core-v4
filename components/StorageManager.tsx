import React, { useState, useCallback } from 'react';
import { PersistentStorageService } from '../services/persistentStorage';
import { TrashIcon, DownloadIcon, PlayIcon, RefreshCwIcon } from './icons';

interface StorageManagerProps {
  onStorageReset?: () => void;
  className?: string;
}

const StorageManager: React.FC<StorageManagerProps> = ({
  onStorageReset,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number; percentage: number } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    createBackup: true,
    clearApiKeys: false,
    clearUserPreferences: false
  });

  const storageService = PersistentStorageService.getInstance();

  const updateStorageInfo = useCallback(() => {
    const info = storageService.getStorageInfo();
    setStorageInfo(info);
  }, [storageService]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    updateStorageInfo();
  }, [updateStorageInfo]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleResetStorage = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await storageService.resetAllData(resetOptions);
      
      if (result.success) {
        if (result.backupData && resetOptions.createBackup) {
          // Download backup file
          const blob = new Blob([result.backupData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sentient-core-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }

        setMessage({ type: 'success', text: 'Storage reset successfully!' });
        updateStorageInfo();
        onStorageReset?.();
        
        // Auto-close after success
        setTimeout(() => {
          setIsOpen(false);
          setShowConfirmDialog(false);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to reset storage' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [storageService, resetOptions, updateStorageInfo, onStorageReset]);

  const handleBackupDownload = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await storageService.clearStorage(true);
      if (result.success && result.backupData) {
        const blob = new Blob([result.backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sentient-core-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Backup downloaded successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setIsLoading(false);
    }
  }, [storageService]);

  const handleBackupRestore = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = e.target?.result as string;
        const result = await storageService.restoreFromBackup(backupData);
        
        if (result.success) {
          setMessage({ type: 'success', text: 'Backup restored successfully!' });
          updateStorageInfo();
          onStorageReset?.();
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to restore backup' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid backup file' });
      }
    };
    reader.readAsText(file);
  }, [storageService, updateStorageInfo, onStorageReset]);

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className={`px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${className}`}
        title="Manage Storage"
      >
        <TrashIcon />
        Storage
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100">Storage Management</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Storage Info */}
          {storageInfo && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Storage Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Used:</span>
                  <span className="text-slate-200">{formatBytes(storageInfo.used)}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      storageInfo.percentage > 80 ? 'bg-red-500' : 
                      storageInfo.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {storageInfo.percentage.toFixed(1)}% of available storage
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-700/30' :
              message.type === 'error' ? 'bg-red-900/30 text-red-300 border border-red-700/30' :
              'bg-blue-900/30 text-blue-300 border border-blue-700/30'
            }`}>
              {message.type === 'success' && <span className="text-green-400">✓</span>}
              {message.type === 'error' && <span className="text-red-400">⚠</span>}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Backup & Restore */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Backup & Restore</h3>
            <div className="flex gap-2">
              <button
                onClick={handleBackupDownload}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <DownloadIcon />
                Download Backup
              </button>
              <label className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <PlayIcon />
                Restore Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Reset Options</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={resetOptions.createBackup}
                  onChange={(e) => setResetOptions(prev => ({ ...prev, createBackup: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                Create backup before reset
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={resetOptions.clearApiKeys}
                  onChange={(e) => setResetOptions(prev => ({ ...prev, clearApiKeys: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                Clear API keys
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={resetOptions.clearUserPreferences}
                  onChange={(e) => setResetOptions(prev => ({ ...prev, clearUserPreferences: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                Clear user preferences
              </label>
            </div>
          </div>

          {/* Reset Button */}
          {!showConfirmDialog ? (
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <TrashIcon />
              Reset All Storage
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-300 mb-2">
                  <span className="text-red-400">⚠</span>
                  <span className="font-medium">Confirm Reset</span>
                </div>
                <p className="text-sm text-red-200">
                  This will permanently delete all stored data including projects, documents, and settings.
                  {resetOptions.createBackup && " A backup will be downloaded first."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetStorage}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isLoading ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageManager;
