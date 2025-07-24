import React from 'react';
import { BotIcon, RefreshCwIcon, ChevronLeftIcon, CogIcon } from './icons';
import StorageManager from './StorageManager';

interface HeaderProps {
    onReset?: () => void;
    onBackToProjects: () => void;
    activeProjectId: string | null;
    t: any; // Translation object
    onOpenSettings: () => void;
    onStorageReset?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, onBackToProjects, activeProjectId, t, onOpenSettings, onStorageReset }) => {
    return (
        <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 p-4 flex justify-between items-center relative z-50">
            <div className="flex items-center gap-3">
                <BotIcon />
                <h1 className="text-xl font-bold text-slate-100">{t.headerTitle}</h1>
            </div>
            <div className="flex items-center gap-4">
                 {activeProjectId && (
                    <button
                        onClick={onBackToProjects}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-semibold transition-colors"
                        title={t.backToProjects}
                    >
                        <ChevronLeftIcon />
                        {t.backToProjects}
                    </button>
                )}
                {activeProjectId && onReset && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-md text-sm font-semibold transition-colors"
                        title={t.resetProject}
                    >
                        <RefreshCwIcon />
                    </button>
                )}
                <StorageManager 
                    onStorageReset={onStorageReset}
                    className=""
                />
                <button
                    onClick={onOpenSettings}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-sm font-semibold transition-colors"
                    title={t.settings}
                >
                    <CogIcon />
                </button>
            </div>
        </header>
    );
};

export default Header;