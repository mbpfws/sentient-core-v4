import React from 'react';
import { ProjectState } from '../types';
import { FolderIcon, TrashIcon } from './icons';

interface ProjectManagerProps {
    projects: ProjectState[];
    onSelectProject: (projectId: string) => void;
    onCreateProject: () => void;
    onDeleteProject: (projectId: string) => void;
    t: any; // Translation object
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, onSelectProject, onCreateProject, onDeleteProject, t }) => {
    return (
        <div className="max-w-4xl mx-auto p-8 bg-slate-800/50 rounded-lg">
            <h2 className="text-3xl font-bold text-slate-100 mb-6 text-center">{t.projectManagerTitle}</h2>
            
            <div className="mb-8 text-center">
                <button
                    onClick={onCreateProject}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-lg font-semibold transition-colors"
                >
                    {t.createNewProject}
                </button>
            </div>
            
            <div className="space-y-4">
                {projects.length > 0 ? (
                    projects.map(project => (
                        <div
                            key={project.id}
                            className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            <div 
                                className="flex items-center gap-4 cursor-pointer flex-grow"
                                onClick={() => onSelectProject(project.id)}
                            >
                                <FolderIcon />
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-200">{project.description}</p>
                                    <p className="text-xs text-slate-400">ID: {project.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteProject(project.id);
                                }}
                                className="p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                                title={t.deleteProject}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-500 py-8">{t.noProjects}</p>
                )}
            </div>
        </div>
    );
};

export default ProjectManager;