"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-primary mt-4"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      <Copy size={17} /> {copied ? "Copied" : "Copy voucher"}
    </button>
  );
}
