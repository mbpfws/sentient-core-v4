import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ExpandIcon, 
  ShrinkIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon
} from './icons';

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel?: React.ReactNode;
  className?: string;
  defaultLeftSize?: number;
  defaultRightSize?: number;
  defaultBottomSize?: number;
  showBottomPanel?: boolean;
  onToggleBottomPanel?: () => void;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftPanel,
  rightPanel,
  bottomPanel,
  className = '',
  defaultLeftSize = 30,
  defaultRightSize = 70,
  defaultBottomSize = 40,
  showBottomPanel = false,
  onToggleBottomPanel
}) => {
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  const ResizeHandle = ({ direction }: { direction: 'horizontal' | 'vertical' }) => (
    <PanelResizeHandle className={`group ${direction === 'horizontal' ? 'w-2' : 'h-2'} bg-slate-700 hover:bg-slate-600 transition-colors relative`}>
      <div className={`absolute inset-0 flex items-center justify-center ${direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize'}`}>
        <div className={`${direction === 'horizontal' ? 'w-1 h-8' : 'w-8 h-1'} bg-slate-500 group-hover:bg-slate-400 rounded transition-colors`} />
      </div>
    </PanelResizeHandle>
  );

  const ControlBar = () => (
    <div className="flex items-center gap-2 p-2 bg-slate-800/50 border-b border-slate-700">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          title={isLeftCollapsed ? "Expand left panel" : "Collapse left panel"}
        >
          {isLeftCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
        <button
          onClick={() => setIsRightCollapsed(!isRightCollapsed)}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          title={isRightCollapsed ? "Expand right panel" : "Collapse right panel"}
        >
          {isRightCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
      </div>
      
      <div className="w-px h-4 bg-slate-600" />
      
      <div className="flex items-center gap-1">
        <button
          onClick={handleZoomOut}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          title="Zoom out"
        >
          <ZoomOutIcon />
        </button>
        <span className="text-xs text-slate-400 min-w-[3rem] text-center">
          {zoom}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          title="Zoom in"
        >
          <ZoomInIcon />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          title="Reset zoom"
        >
          <MaximizeIcon />
        </button>
      </div>

      {onToggleBottomPanel && (
        <>
          <div className="w-px h-4 bg-slate-600" />
          <button
            onClick={onToggleBottomPanel}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
            title={showBottomPanel ? "Hide bottom panel" : "Show bottom panel"}
          >
            {showBottomPanel ? <ShrinkIcon /> : <ExpandIcon />}
          </button>
        </>
      )}
    </div>
  );

  if (showBottomPanel && bottomPanel) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <ControlBar />
        <div className="flex-1 overflow-hidden" style={{ zoom: `${zoom}%` }}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={100 - defaultBottomSize} minSize={30}>
              <PanelGroup direction="horizontal">
                <Panel 
                  defaultSize={isLeftCollapsed ? 0 : defaultLeftSize} 
                  minSize={isLeftCollapsed ? 0 : 20}
                  maxSize={isLeftCollapsed ? 0 : 80}
                  collapsible={true}
                  className="overflow-hidden"
                >
                  {!isLeftCollapsed && (
                    <div className="h-full overflow-auto bg-slate-800/30 border-r border-slate-700">
                      {leftPanel}
                    </div>
                  )}
                </Panel>
                
                {!isLeftCollapsed && <ResizeHandle direction="horizontal" />}
                
                <Panel 
                  defaultSize={isRightCollapsed ? 100 : (isLeftCollapsed ? 100 : defaultRightSize)}
                  minSize={isRightCollapsed ? 100 : 20}
                  className="overflow-hidden"
                >
                  {!isRightCollapsed && (
                    <div className="h-full overflow-auto bg-slate-800/30">
                      {rightPanel}
                    </div>
                  )}
                </Panel>
              </PanelGroup>
            </Panel>
            
            <ResizeHandle direction="vertical" />
            
            <Panel defaultSize={defaultBottomSize} minSize={20} maxSize={60}>
              <div className="h-full overflow-auto bg-slate-800/30 border-t border-slate-700">
                {bottomPanel}
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <ControlBar />
      <div className="flex-1 overflow-hidden" style={{ zoom: `${zoom}%` }}>
        <PanelGroup direction="horizontal">
          <Panel 
            defaultSize={isLeftCollapsed ? 0 : defaultLeftSize} 
            minSize={isLeftCollapsed ? 0 : 20}
            maxSize={isLeftCollapsed ? 0 : 80}
            collapsible={true}
            className="overflow-hidden"
          >
            {!isLeftCollapsed && (
              <div className="h-full overflow-auto bg-slate-800/30 border-r border-slate-700">
                {leftPanel}
              </div>
            )}
          </Panel>
          
          {!isLeftCollapsed && <ResizeHandle direction="horizontal" />}
          
          <Panel 
            defaultSize={isRightCollapsed ? 100 : (isLeftCollapsed ? 100 : defaultRightSize)}
            minSize={isRightCollapsed ? 100 : 20}
            className="overflow-hidden"
          >
            {!isRightCollapsed && (
              <div className="h-full overflow-auto bg-slate-800/30">
                {rightPanel}
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default ResizableLayout;
export { ResizableLayout };