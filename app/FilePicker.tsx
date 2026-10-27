"use client";

import { useRef, useState } from "react";

const size = (n: number) => (n < 1024 * 1024 ? `${Math.ceil(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

// Drop zone + removable file list. The real <input type="file"> stays in the form, so FormData picks the files up.
export default function FilePicker({ name, accept, labelId }: { name: string; accept: string; labelId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);

  function set(list: File[]) {
    const dt = new DataTransfer();
    list.forEach((f) => dt.items.add(f));
    input.current!.files = dt.files;
    setFiles(list);
  }

  function add(added: FileList | null) {
    if (!added?.length) return;
    const all = [...files, ...Array.from(added)];
    set(all.filter((f, i) => all.findIndex((g) => g.name === f.name && g.size === f.size) === i));
  }

  return (
    <div>
      <label
        className={`drop${drag ? " drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
      >
        <input
          ref={input}
          type="file"
          name={name}
          multiple
          accept={accept}
          className="sr-only"
          aria-labelledby={labelId}
          onChange={(e) => add(e.target.files)}
        />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          <strong>Choose files</strong>
          <span className="drop-hint"> or drop them here</span>
        </span>
      </label>
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={f.name + f.size}>
              <span>{f.name}</span>
              <small>{size(f.size)}</small>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => set(files.filter((_, j) => j !== i))}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
