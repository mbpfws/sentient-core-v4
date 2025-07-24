export interface ErrorCorrectionResult {
  correctedContent: string;
  errorType: 'mermaid' | 'svg' | 'syntax' | 'unknown';
  corrections: string[];
  confidence: number;
  requiresRegeneration: boolean;
}

export class IntelligentErrorCorrectionService {
  private static instance: IntelligentErrorCorrectionService;

  static getInstance(): IntelligentErrorCorrectionService {
    if (!this.instance) {
      this.instance = new IntelligentErrorCorrectionService();
    }
    return this.instance;
  }

  /**
   * Analyzes and corrects Mermaid syntax errors
   */
  async correctMermaidSyntax(
    errorMessage: string,
    problematicCode: string,
    context?: string
  ): Promise<ErrorCorrectionResult> {
    const prompt = `
You are an expert Mermaid diagram syntax corrector. Analyze the following Mermaid code that failed to render and fix all syntax errors.

ERROR MESSAGE: ${errorMessage}

PROBLEMATIC MERMAID CODE:
\`\`\`mermaid
${problematicCode}
\`\`\`

${context ? `CONTEXT: ${context}` : ''}

REQUIREMENTS:
1. Fix all syntax errors while preserving the diagram's intent
2. Ensure proper Mermaid syntax (graph TD, flowchart, sequenceDiagram, etc.)
3. Fix node naming, connections, and formatting issues
4. Remove any invalid characters or malformed statements
5. Maintain the original diagram structure and meaning

Return ONLY valid Mermaid code without markdown formatting or explanations.
`;

    try {
      const response = await this.aiService.generateContentWithStreaming(prompt, () => {}, () => {});
      const correctedCode = this.cleanMermaidCode(response);
      
      // Validate the corrected code
      const isValid = await this.validateMermaidSyntax(correctedCode);
      
      return {
        correctedContent: correctedCode,
        errorType: 'mermaid',
        corrections: this.extractCorrections(problematicCode, correctedCode),
        confidence: isValid ? 0.9 : 0.6,
        requiresRegeneration: !isValid
      };
    } catch (error) {
      console.error('Mermaid correction failed:', error);
      return {
        correctedContent: this.generateFallbackMermaid(context || 'Diagram'),
        errorType: 'mermaid',
        corrections: ['Generated fallback diagram due to correction failure'],
        confidence: 0.3,
        requiresRegeneration: true
      };
    }
  }

  /**
   * Analyzes and corrects SVG generation errors
   */
  async correctSvgGeneration(
    errorMessage: string,
    problematicSvg: string,
    context?: string
  ): Promise<ErrorCorrectionResult> {
    const prompt = `
You are an expert SVG generator and corrector. Analyze the following SVG code that failed to render and fix all issues.

ERROR MESSAGE: ${errorMessage}

PROBLEMATIC SVG CODE:
${problematicSvg}

${context ? `CONTEXT: ${context}` : ''}

REQUIREMENTS:
1. Generate valid, well-formed SVG markup
2. Fix any malformed tags, attributes, or structure issues
3. Ensure proper viewBox, width, and height attributes
4. Create a clean, professional UI mockup if this is for interface design
5. Use proper SVG elements (rect, circle, text, path, etc.)
6. Maintain responsive design principles

Return ONLY valid SVG code without markdown formatting or explanations.
`;

    try {
      const response = await this.aiService.generateContent(prompt);
      const correctedSvg = this.cleanSvgCode(response);
      
      // Validate the corrected SVG
      const isValid = this.validateSvgSyntax(correctedSvg);
      
      return {
        correctedContent: correctedSvg,
        errorType: 'svg',
        corrections: this.extractCorrections(problematicSvg, correctedSvg),
        confidence: isValid ? 0.85 : 0.5,
        requiresRegeneration: !isValid
      };
    } catch (error) {
      console.error('SVG correction failed:', error);
      return {
        correctedContent: this.generateFallbackSvg(context || 'UI Mockup'),
        errorType: 'svg',
        corrections: ['Generated fallback SVG due to correction failure'],
        confidence: 0.3,
        requiresRegeneration: true
      };
    }
  }

  /**
   * Clean and extract Mermaid code from AI response
   */
  private cleanMermaidCode(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Ensure it starts with a valid Mermaid diagram type
    const mermaidKeywords = [
      'graph TD', 'graph LR', 'graph TB', 'graph RL',
      'flowchart TD', 'flowchart LR', 'flowchart TB', 'flowchart RL',
      'sequenceDiagram', 'classDiagram', 'stateDiagram',
      'erDiagram', 'journey', 'gantt', 'pie title', 'gitgraph'
    ];
    
    const hasValidStart = mermaidKeywords.some(keyword => 
      cleaned.startsWith(keyword)
    );
    
    if (!hasValidStart && !cleaned.includes('sequenceDiagram')) {
      // Default to flowchart if no valid start detected
      cleaned = `flowchart TD\n${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Clean and extract SVG code from AI response
   */
  private cleanSvgCode(response: string): string {
    // Extract SVG content between <svg> tags
    const svgMatch = response.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      return svgMatch[0];
    }
    
    // If no complete SVG found, try to construct one
    let cleaned = response.trim();
    if (!cleaned.startsWith('<svg')) {
      cleaned = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">${cleaned}</svg>`;
    }
    
    return cleaned;
  }

  /**
   * Validate Mermaid syntax using basic checks
   */
  private async validateMermaidSyntax(code: string): Promise<boolean> {
    try {
      // Basic syntax validation
      const lines = code.split('\n').filter(line => line.trim());
      if (lines.length === 0) return false;
      
      // Check for valid diagram type
      const firstLine = lines[0].trim();
      const validTypes = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
        'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitgraph'
      ];
      
      return validTypes.some(type => firstLine.startsWith(type));
    } catch {
      return false;
    }
  }

  /**
   * Validate SVG syntax using basic checks
   */
  private validateSvgSyntax(svg: string): boolean {
    try {
      // Basic SVG validation
      return svg.includes('<svg') && svg.includes('</svg>') && 
             !svg.includes('<script') && // Security check
             svg.includes('viewBox') || svg.includes('width');
    } catch {
      return false;
    }
  }

  /**
   * Extract corrections made between original and corrected code
   */
  private extractCorrections(original: string, corrected: string): string[] {
    const corrections: string[] = [];
    
    if (original.length !== corrected.length) {
      corrections.push('Adjusted content length and structure');
    }
    
    if (original.includes('```') && !corrected.includes('```')) {
      corrections.push('Removed markdown code block formatting');
    }
    
    if (!original.match(/^(graph|flowchart|sequenceDiagram)/m) && 
        corrected.match(/^(graph|flowchart|sequenceDiagram)/m)) {
      corrections.push('Added proper diagram type declaration');
    }
    
    corrections.push('Applied syntax corrections and formatting improvements');
    
    return corrections;
  }

  /**
   * Generate fallback Mermaid diagram
   */
  private generateFallbackMermaid(context: string): string {
    return `flowchart TD
    A[${context}] --> B[Processing]
    B --> C[Output]
    C --> D[Complete]
    
    style A fill:#e1f5fe
    style D fill:#c8e6c9`;
  }

  /**
   * Generate fallback SVG mockup
   */
  private generateFallbackSvg(context: string): string {
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
  <rect x="20" y="20" width="360" height="40" fill="#2196f3" rx="4"/>
  <text x="200" y="45" text-anchor="middle" fill="white" font-family="Arial" font-size="16">${context}</text>
  <rect x="20" y="80" width="170" height="100" fill="white" stroke="#ddd" stroke-width="1" rx="4"/>
  <rect x="210" y="80" width="170" height="100" fill="white" stroke="#ddd" stroke-width="1" rx="4"/>
  <rect x="20" y="200" width="360" height="60" fill="white" stroke="#ddd" stroke-width="1" rx="4"/>
  <text x="200" y="235" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">UI Mockup Placeholder</text>
</svg>`;
  }
}
