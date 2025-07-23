
import React from 'react';

interface EdgeCaseSimulatorProps {
    onSimulate: (scenario: string) => void;
    isWorkflowRunning: boolean;
    t: any; // Translation object
}

const EdgeCaseSimulator: React.FC<EdgeCaseSimulatorProps> = ({ onSimulate, isWorkflowRunning, t }) => {
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h4 className="font-semibold text-slate-300 mb-3">{t.edgeCaseTitle}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <button 
                    onClick={() => onSimulate('ambiguousInput')} 
                    disabled={isWorkflowRunning}
                    className="p-2 bg-yellow-600/30 hover:bg-yellow-600/50 rounded-md text-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {t.simulateAmbiguous}
                </button>
                 <button 
                    onClick={() => onSimulate('conflictingFeedback')} 
                    disabled={true} // Simulation for this is complex, disabled for now
                    className="p-2 bg-red-600/30 hover:bg-red-600/50 rounded-md text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {t.simulateConflict}
                </button>
                 <button 
                    onClick={() => onSimulate('tokenLimit')}
                    disabled={true} // Simulation for this is complex, disabled for now
                    className="p-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-md text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {t.simulateTokenLimit}
                </button>
                 <button 
                    onClick={() => onSimulate('logicalError')} 
                    disabled={!isWorkflowRunning}
                    className="p-2 bg-orange-600/30 hover:bg-orange-600/50 rounded-md text-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {t.simulateFailure}
                </button>
            </div>
             <p className="text-xs text-slate-500 mt-3">{t.edgeCaseDescription}</p>
        </div>
    );
};

export default EdgeCaseSimulator;
