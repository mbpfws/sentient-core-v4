import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-invert prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-slate-100 mb-4 pb-2 border-b border-slate-600">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-slate-200 mb-3 pb-1 border-b border-slate-700">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium text-slate-300 mb-2">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-base font-medium text-slate-300 mb-1">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-slate-400 mb-1">
              {children}
            </h6>
          ),
          
          // Text formatting
          p: ({ children }) => (
            <p className="text-slate-300 mb-4 leading-relaxed">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-100">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-200">
              {children}
            </em>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ml-4">
              {children}
            </li>
          ),
          
          // Blockquotes and callouts
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 bg-slate-800/50 pl-4 py-2 mb-4 italic text-slate-300">
              {children}
            </blockquote>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-600 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-700">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-slate-800/30">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-slate-600">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-slate-200 border-r border-slate-600 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-slate-300 border-r border-slate-600 last:border-r-0">
              {children}
            </td>
          ),
          
          // Code blocks
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <div className="mb-4">
                  <div className="bg-slate-700 px-3 py-1 text-xs font-mono text-slate-300 rounded-t-md border-b border-slate-600">
                    {language}
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !rounded-t-none"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            }
            
            return (
              <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono text-blue-300" {...props}>
                {children}
              </code>
            );
          },
          
          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              {children}
            </a>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className="border-slate-600 my-6" />
          ),
          
          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg border border-slate-600 mb-4"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;