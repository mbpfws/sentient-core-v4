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

    // Log the error message for debugging
    console.log('Mermaid error:', errorMessage);
    corrections.push(`Original error: ${errorMessage}`);

    // Remove markdown code blocks if present
    if (correctedCode.includes('```mermaid')) {
      correctedCode = correctedCode.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
      corrections.push('Removed markdown code block formatting');
    }

    // If the code is empty or too short, generate a fallback immediately
    if (!correctedCode || correctedCode.length < 10) {
      correctedCode = this.generateFallbackMermaid(context || 'Diagram');
      corrections.push('Generated fallback diagram due to insufficient content');
      return {
        correctedContent: correctedCode,
        errorType: 'mermaid',
        corrections,
        confidence: 0.6,
        requiresRegeneration: false
      };
    }

    // Fix common Mermaid syntax issues
    const fixes = this.applyMermaidFixes(correctedCode);
    correctedCode = fixes.code;
    corrections.push(...fixes.corrections);

    // Validate the corrected code
    const isValid = this.validateMermaidSyntax(correctedCode);
    
    if (!isValid) {
      // Generate fallback if still invalid
      const fallbackCode = this.generateFallbackMermaid(context || 'Diagram');
      corrections.push('Generated fallback diagram due to persistent syntax errors');
      
      // Try to preserve some original content in the fallback
      const enhancedFallback = this.enhanceFallbackWithOriginalContent(fallbackCode, problematicCode, context);
      correctedCode = enhancedFallback.code;
      corrections.push(...enhancedFallback.corrections);
    }

    return {
      correctedContent: correctedCode,
      errorType: 'mermaid',
      corrections,
      confidence: isValid ? 0.8 : 0.5,
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
   * Apply comprehensive Mermaid syntax fixes
   */
  private applyMermaidFixes(code: string): { code: string; corrections: string[] } {
    const corrections: string[] = [];
    let fixedCode = code.trim();

    // Remove any HTML/XML tags that might interfere
    if (fixedCode.includes('<') && fixedCode.includes('>')) {
      fixedCode = fixedCode.replace(/<[^>]*>/g, '');
      corrections.push('Removed HTML/XML tags');
    }

    // Remove extra whitespace and normalize line breaks
    fixedCode = fixedCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    fixedCode = fixedCode.replace(/\n\s*\n/g, '\n').trim();

    // Ensure proper diagram type declaration
    const mermaidKeywords = [
      'graph TD', 'graph LR', 'graph TB', 'graph RL',
      'flowchart TD', 'flowchart LR', 'flowchart TB', 'flowchart RL',
      'sequenceDiagram', 'classDiagram', 'stateDiagram', 'stateDiagram-v2',
      'erDiagram', 'journey', 'gantt', 'pie title', 'gitgraph', 'mindmap', 'timeline'
    ];

    const hasValidStart = mermaidKeywords.some(keyword => 
      fixedCode.toLowerCase().startsWith(keyword.toLowerCase())
    );

    if (!hasValidStart) {
      // Try to detect what type of diagram this might be
      if (fixedCode.includes('participant') || fixedCode.includes('actor')) {
        fixedCode = `sequenceDiagram\n${fixedCode}`;
        corrections.push('Added sequenceDiagram declaration');
      } else if (fixedCode.includes('class ') || fixedCode.includes('<<') || fixedCode.includes('>>')) {
        fixedCode = `classDiagram\n${fixedCode}`;
        corrections.push('Added classDiagram declaration');
      } else if (fixedCode.includes('state ') || fixedCode.includes('[*]')) {
        fixedCode = `stateDiagram-v2\n${fixedCode}`;
        corrections.push('Added stateDiagram-v2 declaration');
      } else {
        fixedCode = `flowchart TD\n${fixedCode}`;
        corrections.push('Added flowchart TD declaration');
      }
    }

    // Fix common syntax issues
    const originalCode = fixedCode;
    fixedCode = fixedCode
      // Fix smart quotes and apostrophes
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      // Fix arrow spacing and syntax
      .replace(/\s*-->\s*/g, ' --> ')
      .replace(/\s*->>\s*/g, ' ->> ')
      .replace(/\s*-->>\s*/g, ' -->> ')
      .replace(/\s*-\)\s*/g, ' -) ')
      // Fix node label syntax
      .replace(/\|([^|\n]+)\|/g, '"$1"')
      // Fix bracket syntax for different node types
      .replace(/\[([^\]\n]+)\]/g, '[$1]')
      .replace(/\{([^}\n]+)\}/g, '{$1}')
      .replace(/\(([^)\n]+)\)/g, '($1)')
      // Fix subgraph syntax
      .replace(/subgraph\s+([^\n]+)/g, 'subgraph $1')
      // Fix class definition syntax
      .replace(/class\s+([^\s]+)\s+([^\n]+)/g, 'class $1 $2')
      // Remove invalid characters that commonly cause issues
      .replace(/[\u00A0\u2000-\u200B\u2028\u2029]/g, ' ')
      // Fix multiple spaces
      .replace(/\s+/g, ' ')
      // Fix line endings
      .replace(/\s*\n\s*/g, '\n');

    if (fixedCode !== originalCode) {
      corrections.push('Applied comprehensive syntax corrections and formatting');
    }

    // Validate basic structure
    const lines = fixedCode.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      // Ensure each line after the first has proper syntax
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !this.isValidMermaidLine(line)) {
          // Try to fix common line issues
          if (!line.includes('-->') && !line.includes('->>') && !line.includes(':') && line.includes(' ')) {
            // Might be a node definition, try to fix it
            const parts = line.split(' ');
            if (parts.length >= 2) {
              lines[i] = `    ${parts[0]}["${parts.slice(1).join(' ')}"]`;
              corrections.push('Fixed node definition syntax');
            }
          }
        }
      }
      fixedCode = lines.join('\n');
    }

    return { code: fixedCode, corrections };
  }

  /**
   * Check if a Mermaid line has valid syntax
   */
  private isValidMermaidLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return true; // Empty lines are valid
    
    // Common valid patterns
    const validPatterns = [
      /^\w+\s*-->\s*\w+/, // Basic arrow
      /^\w+\s*->>\s*\w+/, // Sequence diagram arrow
      /^\w+\[.+\]/, // Node with label
      /^\w+\(.+\)/, // Round node
      /^\w+\{.+\}/, // Diamond node
      /^subgraph\s+.+/, // Subgraph
      /^class\s+\w+/, // Class definition
      /^participant\s+\w+/, // Sequence participant
      /^actor\s+\w+/, // Sequence actor
      /^state\s+\w+/, // State definition
      /^\w+\s*:\s*.+/, // Label with colon
      /^\s*style\s+\w+/, // Style definition
      /^\s*classDef\s+\w+/, // Class definition
      /^\s*click\s+\w+/, // Click event
      /^\s*end$/, // End keyword
    ];

    return validPatterns.some(pattern => pattern.test(trimmed));
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
   * Validate Mermaid syntax using comprehensive checks
   */
  private validateMermaidSyntax(code: string): boolean {
    try {
      // Basic syntax validation
      const lines = code.split('\n').filter(line => line.trim());
      if (lines.length === 0) return false;
      
      // Check for valid diagram type (more comprehensive)
      const firstLine = lines[0].trim().toLowerCase();
      const validTypes = [
        'graph', 'flowchart', 'sequencediagram', 'classdiagram', 
        'statediagram', 'erdiagram', 'journey', 'gantt', 'pie', 'gitgraph',
        'mindmap', 'timeline', 'quadrantchart', 'requirement', 'c4context'
      ];
      
      const hasValidType = validTypes.some(type => firstLine.startsWith(type));
      if (!hasValidType) return false;
      
      // Additional validation checks
      const codeStr = code.toLowerCase();
      
      // Check for common syntax errors that would cause rendering to fail
      const criticalErrors = [
        /[\u201C\u201D\u2018\u2019]/, // Smart quotes
        /-->.*-->.*-->/, // Triple arrows (usually invalid)
        /\[\[/, // Double brackets (usually invalid)
        /\]\]/, // Double brackets (usually invalid)
        /\{\{/, // Double braces (usually invalid)
        /\}\}/, // Double braces (usually invalid)
      ];
      
      // If critical errors are found, consider it invalid
      const hasCriticalErrors = criticalErrors.some(pattern => pattern.test(codeStr));
      if (hasCriticalErrors) return false;
      
      // For sequence diagrams, check for basic structure
      if (firstLine.includes('sequence')) {
        const hasParticipantOrActor = codeStr.includes('participant') || codeStr.includes('actor');
        const hasArrows = codeStr.includes('->>') || codeStr.includes('-->>') || codeStr.includes('-)');
        return hasParticipantOrActor || hasArrows;
      }
      
      // For flowcharts/graphs, check for basic structure
      if (firstLine.includes('flowchart') || firstLine.includes('graph')) {
        const hasArrows = codeStr.includes('-->') || codeStr.includes('---');
        const hasNodes = /\w+\[.*\]/.test(codeStr) || /\w+\(.*\)/.test(codeStr) || /\w+\{.*\}/.test(codeStr);
        return hasArrows || hasNodes || lines.length <= 2; // Allow simple diagrams
      }
      
      // For other diagram types, be more permissive
      return true;
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
    const sanitizedContext = context.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Diagram';
    return `flowchart TD
    A["${sanitizedContext}"] --> B["Processing"]
    B --> C["Output"]
    C --> D["Complete"]
    
    style A fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style D fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style B fill:#fff3e0,stroke:#ef6c00,stroke-width:1px
    style C fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1px`;
  }

  /**
   * Enhance fallback diagram with content from original problematic code
   */
  private enhanceFallbackWithOriginalContent(
    fallbackCode: string, 
    originalCode: string, 
    context?: string
  ): { code: string; corrections: string[] } {
    const corrections: string[] = [];
    let enhancedCode = fallbackCode;

    try {
      // Extract meaningful words from the original code
      const words = originalCode
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && word.length < 20)
        .slice(0, 6); // Limit to 6 words

      if (words.length > 0) {
        // Create a more meaningful fallback diagram using extracted words
        const sanitizedWords = words.map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
        const contextTitle = context || sanitizedWords[0] || 'Diagram';
        
        enhancedCode = `flowchart TD
    Start["${contextTitle}"] --> Process["Processing"]
    Process --> Result["Result"]
    Result --> End["Complete"]
    
    %% Enhanced with original content
    subgraph "Content"
        ${sanitizedWords.slice(0, 4).map((word, i) => 
          `N${i + 1}["${word}"]`
        ).join('\n        ')}
    end
    
    Process --> Content
    Content --> Result
    
    style Start fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style End fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    style Process fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style Result fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px`;
        
        corrections.push(`Enhanced fallback with extracted content: ${sanitizedWords.join(', ')}`);
      }
    } catch (error) {
      corrections.push('Used basic fallback due to content extraction error');
    }

    return { code: enhancedCode, corrections };
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
