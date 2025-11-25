import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  segments?: Array<{ text: string; isTranslatable: boolean; startIndex: number; endIndex: number }>;
  onSegmentClick?: (index: number) => void;
  selectedSegmentIndex?: number | null;
  readOnly?: boolean;
  placeholder?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  className?: string;
}

export const CodeEditor = ({
  value,
  onChange,
  segments,
  onSegmentClick,
  selectedSegmentIndex,
  readOnly = false,
  placeholder,
  scrollRef,
  onScroll,
  className
}: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = value.split('\n');
  const lineCount = lines.length;

  // Sync scroll between line numbers and content
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (lineNumbersRef.current && scrollRef?.current) {
      lineNumbersRef.current.scrollTop = scrollRef.current.scrollTop;
    }
    onScroll?.(e);
  };

  useEffect(() => {
    if (textareaRef.current && scrollRef?.current) {
      const textarea = textareaRef.current;
      const scrollArea = scrollRef.current;
      
      const syncScroll = () => {
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = scrollArea.scrollTop;
        }
      };

      scrollArea.addEventListener('scroll', syncScroll);
      return () => scrollArea.removeEventListener('scroll', syncScroll);
    }
  }, [scrollRef]);

  const renderContent = () => {
    if (segments && segments.length > 0) {
      return (
        <div className="font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto p-4 min-h-[400px]">
          {segments.map((segment, index) => (
            <span
              key={index}
              onClick={() => onSegmentClick?.(index)}
              className={cn(
                "transition-all duration-200",
                segment.isTranslatable && "cursor-pointer hover:opacity-80",
                segment.isTranslatable && selectedSegmentIndex !== index && "bg-primary/20 text-primary-foreground border-b-2 border-primary/40",
                selectedSegmentIndex === index && "bg-accent text-accent-foreground border-b-2 border-accent-foreground font-semibold"
              )}
            >
              {segment.text}
            </span>
          ))}
        </div>
      );
    }

    if (readOnly) {
      return (
        <div className="font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto p-4 min-h-[400px] text-foreground">
          {value || <span className="text-muted-foreground">{placeholder}</span>}
        </div>
      );
    }

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-full min-h-[400px] font-mono text-sm leading-relaxed bg-transparent border-0 outline-none resize-none p-4 text-foreground placeholder:text-muted-foreground"
        style={{ 
          WebkitTextSizeAdjust: 'none',
          lineHeight: '1.75rem',
          whiteSpace: 'pre',
          overflowX: 'auto'
        }}
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex border rounded-lg overflow-hidden bg-card",
        className
      )}
    >
      {/* Line Numbers */}
      <div 
        ref={lineNumbersRef}
        className="flex-shrink-0 w-12 bg-muted/30 border-r border-border overflow-hidden select-none"
      >
        <div className="py-4 px-2">
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i + 1}
              className="h-7 text-xs text-muted-foreground text-right leading-relaxed font-mono"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto"
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};
    
