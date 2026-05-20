import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  iconClassName?: string;
}

export function CopyButton({ text, className, iconClassName = 'h-4 w-4' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — fail silently
    }
  };
  return (
    <button
      onClick={handle}
      title="Copy"
      aria-label="Copy to clipboard"
      className={className}
    >
      {copied
        ? <Check className={`${iconClassName} text-green-400 animate-scale-in`} />
        : <Copy className={iconClassName} />}
    </button>
  );
}
