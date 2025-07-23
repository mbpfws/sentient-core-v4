import React, { useState } from 'react';
import { PlayIcon } from './icons';

interface ProjectInputProps {
  onStartProject: (description: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  t: any; // Translation object
}

const ProjectInput: React.FC<ProjectInputProps> = ({ onStartProject, onCancel, isLoading, t }) => {
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onStartProject(description.trim());
    }
  };

  const handleSampleClick = (sample: string) => {
    setDescription(sample);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-800/50 rounded-lg max-w-4xl mx-auto">
      <div className="w-full max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-100 mb-2">{t.defineProjectTitle}</h2>
        <p className="text-slate-400 mb-6">{t.defineProjectDescription}</p>
        
        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.projectInputPlaceholder}
            className="w-full h-40 p-4 bg-slate-900 border border-slate-700 rounded-md text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
            disabled={isLoading}
          />
          <div className="mt-4 flex gap-4">
             <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-md text-lg font-semibold transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!description.trim() || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md text-lg font-semibold transition-colors"
            >
              {isLoading ? t.initializing : t.startGeneration}
              <PlayIcon />
            </button>
          </div>
        </form>

        <div className="mt-8">
            <h3 className="text-slate-400 text-sm font-medium mb-3">{t.trySample}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {t.sampleProjects.map((sample: string, i: number) => (
                    <button 
                        key={i}
                        onClick={() => handleSampleClick(sample)}
                        className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md text-left text-slate-300 transition-colors"
                    >
                        {sample}
                    </button>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectInput;