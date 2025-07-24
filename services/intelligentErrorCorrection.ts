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
   * Analyzes and corrects Mermaid syntax errors using rule-based fixes
   */
  correctMermaidSyntax(
    errorMessage: string,
    problematicCode: string,
    context?: string
  ): ErrorCorrectionResult {
    const corrections: string[] = [];
    let correctedCode = problematicCode.trim();

    // Remove markdown code blocks if present
    if (correctedCode.includes('```mermaid')) {
      correctedCode = correctedCode.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
      corrections.push('Removed markdown code block formatting');
    }

    // Fix common Mermaid syntax issues
    const fixes = this.applyMermaidFixes(correctedCode);
    correctedCode = fixes.code;
    corrections.push(...fixes.corrections);

    // Validate the corrected code
    const isValid = this.validateMermaidSyntax(correctedCode);
    
    if (!isValid) {
      // Generate fallback if still invalid
      correctedCode = this.generateFallbackMermaid(context || 'Diagram');
      corrections.push('Generated fallback diagram due to persistent syntax errors');
    }

    return {
      correctedContent: correctedCode,
      errorType: 'mermaid',
      corrections,
      confidence: isValid ? 0.8 : 0.4,
      requiresRegeneration: !isValid
    };
  }

  /**
   * Analyzes and corrects SVG generation errors using rule-based fixes
   */
  correctSvgGeneration(
    errorMessage: string,
    problematicSvg: string,
    context?: string
  ): ErrorCorrectionResult {
    const corrections: string[] = [];
    let correctedSvg = problematicSvg.trim();

    // Apply SVG fixes
    const fixes = this.applySvgFixes(correctedSvg);
    correctedSvg = fixes.code;
    corrections.push(...fixes.corrections);

    // Validate the corrected SVG
    const isValid = this.validateSvgSyntax(correctedSvg);
    
    if (!isValid) {
      // Generate fallback if still invalid
      correctedSvg = this.generateFallbackSvg(context || 'UI Mockup');
      corrections.push('Generated fallback SVG due to persistent syntax errors');
    }

    return {
      correctedContent: correctedSvg,
      errorType: 'svg',
      corrections,
      confidence: isValid ? 0.7 : 0.4,
      requiresRegeneration: !isValid
    };
  }

  /**
   * Apply common Mermaid syntax fixes
   */
  private applyMermaidFixes(code: string): { code: string; corrections: string[] } {
    const corrections: string[] = [];
    let fixedCode = code;

    // Ensure proper diagram type declaration
    const mermaidKeywords = [
      'graph TD', 'graph LR', 'graph TB', 'graph RL',
      'flowchart TD', 'flowchart LR', 'flowchart TB', 'flowchart RL',
      'sequenceDiagram', 'classDiagram', 'stateDiagram',
      'erDiagram', 'journey', 'gantt', 'pie title', 'gitgraph'
    ];

    const hasValidStart = mermaidKeywords.some(keyword => 
      fixedCode.trim().startsWith(keyword)
    );

    if (!hasValidStart) {
      fixedCode = `flowchart TD\n${fixedCode}`;
      corrections.push('Added proper diagram type declaration');
    }

    // Fix common syntax issues
    fixedCode = fixedCode
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
      .replace(/\s+-->/g, ' -->') // Fix arrow spacing
      .replace(/-->\s+/g, '--> ') // Fix arrow spacing
      .replace(/\|([^|]+)\|/g, '"$1"') // Fix node labels
      .replace(/\[([^\]]+)\]/g, '[$1]') // Ensure proper brackets
      .replace(/\{([^}]+)\}/g, '{$1}') // Ensure proper braces
      .replace(/\(([^)]+)\)/g, '($1)'); // Ensure proper parentheses

    if (fixedCode !== code) {
      corrections.push('Applied syntax corrections and formatting improvements');
    }

    return { code: fixedCode, corrections };
  }

  /**
   * Apply common SVG syntax fixes
   */
  private applySvgFixes(svg: string): { code: string; corrections: string[] } {
    const corrections: string[] = [];
    let fixedSvg = svg;

    // Extract SVG content if wrapped in other content
    const svgMatch = fixedSvg.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch && svgMatch[0] !== fixedSvg) {
      fixedSvg = svgMatch[0];
      corrections.push('Extracted SVG content from surrounding text');
    }

    // Ensure proper SVG structure
    if (!fixedSvg.includes('<svg')) {
      fixedSvg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">${fixedSvg}</svg>`;
      corrections.push('Added proper SVG wrapper');
    }

    // Fix common SVG issues
    if (!fixedSvg.includes('viewBox') && !fixedSvg.includes('width')) {
      fixedSvg = fixedSvg.replace('<svg', '<svg viewBox="0 0 400 300"');
      corrections.push('Added viewBox attribute');
    }

    if (!fixedSvg.includes('xmlns')) {
      fixedSvg = fixedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      corrections.push('Added XML namespace');
    }

    return { code: fixedSvg, corrections };
  }

  /**
   * Validate Mermaid syntax using basic checks
   */
  private validateMermaidSyntax(code: string): boolean {
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
             (svg.includes('viewBox') || svg.includes('width'));
    } catch {
      return false;
    }
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
