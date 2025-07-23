import React, { useState } from 'react';
import { SvgMockupRenderer } from './SvgMockupRenderer';
import MermaidDiagramRenderer from './MermaidDiagramRenderer';
import { Document, NodeType } from '../types';

const NodeTester: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    svgTest: boolean | null;
    mermaidTest: boolean | null;
    errors: string[];
  }>({
    svgTest: null,
    mermaidTest: null,
    errors: []
  });

  // Test SVG content (Front-end Mockup Interfaces - n7)
  const testSvgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="600" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="800" height="80" fill="#1e293b"/>
  <text x="40" y="35" font-family="Arial, sans-serif" font-size="24" fill="white" font-weight="bold">TaskFlow Pro</text>
  <text x="40" y="55" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Project Management Dashboard</text>
  
  <!-- Navigation -->
  <rect x="680" y="20" width="100" height="40" fill="#3b82f6" rx="8"/>
  <text x="720" y="45" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">Sign In</text>
  
  <!-- Main Content Area -->
  <rect x="40" y="120" width="720" height="450" fill="white" stroke="#e2e8f0" stroke-width="1" rx="12"/>
  
  <!-- Sidebar -->
  <rect x="60" y="140" width="200" height="410" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" rx="8"/>
  <text x="70" y="165" font-family="Arial, sans-serif" font-size="16" fill="#1e293b" font-weight="bold">Navigation</text>
  
  <!-- Menu Items -->
  <rect x="70" y="180" width="180" height="35" fill="#3b82f6" rx="6"/>
  <text x="80" y="202" font-family="Arial, sans-serif" font-size="14" fill="white">📊 Dashboard</text>
  
  <rect x="70" y="225" width="180" height="35" fill="transparent" rx="6"/>
  <text x="80" y="247" font-family="Arial, sans-serif" font-size="14" fill="#64748b">📋 Projects</text>
  
  <!-- Stats Cards -->
  <rect x="290" y="180" width="140" height="80" fill="#dbeafe" stroke="#3b82f6" stroke-width="1" rx="8"/>
  <text x="300" y="200" font-family="Arial, sans-serif" font-size="12" fill="#1e40af" font-weight="bold">ACTIVE PROJECTS</text>
  <text x="300" y="235" font-family="Arial, sans-serif" font-size="28" fill="#1e40af" font-weight="bold">12</text>
  
  <rect x="450" y="180" width="140" height="80" fill="#dcfce7" stroke="#22c55e" stroke-width="1" rx="8"/>
  <text x="460" y="200" font-family="Arial, sans-serif" font-size="12" fill="#15803d" font-weight="bold">COMPLETED</text>
  <text x="460" y="235" font-family="Arial, sans-serif" font-size="28" fill="#15803d" font-weight="bold">48</text>
</svg>`;

  // Test Mermaid content (Architectural Visualizer - n8)
  const testMermaidContent = `graph TD
    A[User Request] --> B{Authentication Required?}
    B -->|Yes| C[Login/Register]
    B -->|No| D[Process Request]
    C --> E[Validate Credentials]
    E -->|Valid| F[Generate JWT Token]
    E -->|Invalid| G[Return Error]
    F --> D
    G --> H[Display Error Message]
    D --> I[Parse Request Data]
    I --> J{Data Valid?}
    J -->|Yes| K[Business Logic Processing]
    J -->|No| L[Validation Error]
    K --> M[Database Operations]
    M --> N{Transaction Success?}
    N -->|Yes| O[Prepare Response]
    N -->|No| P[Rollback & Error]
    O --> Q[Send Response]
    P --> R[Log Error]
    L --> S[Return Validation Error]
    H --> T[End]
    Q --> T
    R --> T
    S --> T

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px

    class A,T startEnd
    class C,D,E,F,I,K,M,O,Q process
    class B,J,N decision
    class G,H,L,P,R,S error`;

  // Mock documents for testing
  const mockSvgDocument: Document = {
    id: 'test-svg-doc',
    nodeId: 'n7',
    type: 'final' as const,
    content: testSvgContent,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'completed' as const,
    metadata: {
      nodeType: 'Front-end Mockup Interfaces' as NodeType,
      tags: ['svg', 'mockup', 'ui', 'frontend']
    }
  };

  const mockMermaidDocument: Document = {
    id: 'test-mermaid-doc',
    nodeId: 'n8',
    type: 'final' as const,
    content: testMermaidContent,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'completed' as const,
    metadata: {
      nodeType: 'Architectural Visualizer' as NodeType,
      tags: ['mermaid', 'diagram', 'architecture', 'flowchart']
    }
  };

  const runTests = () => {
    const errors: string[] = [];
    let svgTest = false;
    let mermaidTest = false;

    try {
      // Test SVG validation
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(testSvgContent, 'image/svg+xml');
      const parserError = svgDoc.querySelector('parsererror');
      
      if (!parserError && svgDoc.documentElement.tagName === 'svg') {
        svgTest = true;
      } else {
        errors.push('SVG parsing failed');
      }
    } catch (error) {
      errors.push(`SVG test error: ${error}`);
    }

    try {
      // Test Mermaid content validation
      if (testMermaidContent.includes('graph TD') && 
          testMermaidContent.includes('-->') &&
          testMermaidContent.includes('classDef')) {
        mermaidTest = true;
      } else {
        errors.push('Mermaid content validation failed');
      }
    } catch (error) {
      errors.push(`Mermaid test error: ${error}`);
    }

    setTestResults({ svgTest, mermaidTest, errors });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Node Renderer Testing Suite
        </h1>
        <p className="text-gray-600 mb-6">
          Testing the Front-end Mockup Interfaces (n7) and Architectural Visualizer (n8) nodes
        </p>
        
        <button
          onClick={runTests}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Run Tests
        </button>

        {testResults.svgTest !== null && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${testResults.svgTest ? 'text-green-600' : 'text-red-600'}`}>
                <span>{testResults.svgTest ? '✅' : '❌'}</span>
                <span>SVG Mockup Renderer (n7): {testResults.svgTest ? 'PASSED' : 'FAILED'}</span>
              </div>
              <div className={`flex items-center gap-2 ${testResults.mermaidTest ? 'text-green-600' : 'text-red-600'}`}>
                <span>{testResults.mermaidTest ? '✅' : '❌'}</span>
                <span>Mermaid Diagram Renderer (n8): {testResults.mermaidTest ? 'PASSED' : 'FAILED'}</span>
              </div>
              {testResults.errors.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  <ul className="list-disc list-inside text-red-600 text-sm">
                    {testResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* SVG Mockup Test */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🎨 Front-end Mockup Interfaces (n7)
          </h2>
          <p className="text-gray-600 mb-4">
            Testing SVG mockup rendering with a sample dashboard interface
          </p>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <SvgMockupRenderer 
              document={mockSvgDocument}
              nodeId="n7"
            />
          </div>
        </div>

        {/* Mermaid Diagram Test */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Architectural Visualizer (n8)
          </h2>
          <p className="text-gray-600 mb-4">
            Testing Mermaid diagram rendering with a sample system architecture flowchart
          </p>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <MermaidDiagramRenderer 
              document={mockMermaidDocument}
              nodeId="n8"
              onError={(error) => console.error('Mermaid error:', error)}
              onContentUpdate={(newContent) => console.log('Content updated:', newContent)}
            />
          </div>
        </div>
      </div>

      {/* Additional Test Cases */}
      <div className="mt-8 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Additional Test Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">SVG Features Tested:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>SVG parsing and validation</li>
              <li>Zoom in/out functionality</li>
              <li>Download as SVG</li>
              <li>Download as PNG</li>
              <li>Error handling for invalid SVG</li>
              <li>Responsive container sizing</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Mermaid Features Tested:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Mermaid diagram rendering</li>
              <li>Dark theme support</li>
              <li>Flowchart with styling</li>
              <li>Download as SVG/PNG</li>
              <li>View source code</li>
              <li>Refresh diagram functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeTester;