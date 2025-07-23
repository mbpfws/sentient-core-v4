import React, { useState } from 'react';

interface ApiKeyModalProps {
    onSave: (apiKey: string) => void;
    t: any; // Translation object
    initialKey?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, t, initialKey = '' }) => {
    const [apiKey, setApiKey] = useState(initialKey);

    const handleSave = () => {
        if (apiKey.trim()) {
            onSave(apiKey.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-slate-800 rounded-lg p-8 max-w-lg w-full border border-slate-700 shadow-xl">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">{t.apiKeyModalTitle}</h2>
                <p className="text-slate-400 mb-6">{t.apiKeyModalDescription}</p>
                <div className="flex flex-col gap-4">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={t.apiKeyModalInputPlaceholder}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md text-slate-200 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSave}
                        disabled={!apiKey.trim()}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-md text-lg font-semibold transition-colors"
                    >
                        {t.apiKeyModalSaveButton}
                    </button>
                </div>
                 <div className="text-center mt-6">
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-400 hover:underline"
                    >
                        {t.apiKeyModalLink}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
