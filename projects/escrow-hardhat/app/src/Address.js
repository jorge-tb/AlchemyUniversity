import { useState } from 'react';

// Full address, never truncated — click to copy.
export default function Address({ value, className = '' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <span
      className={`address ${copied ? 'copied' : ''} ${className}`}
      onClick={copy}
      title="Click to copy"
    >
      {value}
      <span className="copy-hint">{copied ? 'copied' : 'copy'}</span>
    </span>
  );
}
