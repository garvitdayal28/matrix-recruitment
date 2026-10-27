"use client";

import { useEffect, useId, useRef, useState } from "react";

type Option = string | { value: string; label: string };

// Custom listbox dropdown. With `name` it posts its value through a hidden input, so it works inside plain forms.
export default function Select({
  options,
  name,
  value,
  onChange,
  placeholder,
  labelId,
  ariaLabel,
  invalid,
}: {
  options: Option[];
  name?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder: string;
  labelId?: string;
  ariaLabel?: string;
  invalid?: boolean;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const [inner, setInner] = useState("");
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function show() {
    setActive(Math.max(0, opts.findIndex((o) => o.value === current)));
    setOpen(true);
  }

  function choose(i: number) {
    if (value === undefined) setInner(opts[i].value);
    onChange?.(opts[i].value);
    setOpen(false);
    trigger.current?.focus();
  }

  function onKey(e: React.KeyboardEvent) {
    const last = opts.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => Math.min(last, a + 1)),
      ArrowUp: () => setActive((a) => Math.max(0, a - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => {
        setOpen(false);
        trigger.current?.focus();
      },
    };
    if (e.key === "Tab") return setOpen(false);
    if (keys[e.key]) {
      e.preventDefault();
      return keys[e.key]();
    }
    // Type-ahead: jump to the next option starting with the typed letter.
    if (e.key.length === 1) {
      const k = e.key.toLowerCase();
      const starts = (o: { label: string }) => o.label.toLowerCase().startsWith(k);
      const next = opts.findIndex((o, j) => j > active && starts(o));
      const i = next >= 0 ? next : opts.findIndex(starts);
      if (i >= 0) setActive(i);
    }
  }

  const label = opts.find((o) => o.value === current)?.label;

  return (
    <div className={`select${open ? " open" : ""}`} ref={root} data-invalid={invalid || undefined}>
      {name && <input type="hidden" name={name} value={current} />}
      <button
        type="button"
        ref={trigger}
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-labelledby={labelId ? `${labelId} ${id}-v` : undefined}
        aria-label={labelId ? undefined : ariaLabel}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
      >
        <span id={`${id}-v`} className={label ? undefined : "placeholder"}>{label ?? placeholder}</span>
        <svg className="chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          id={id}
          ref={list}
          role="listbox"
          tabIndex={-1}
          className="select-list"
          aria-labelledby={labelId}
          aria-label={labelId ? undefined : ariaLabel}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onKey}
        >
          {opts.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === current}
              className={i === active ? "active" : undefined}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              {o.label}
              {o.value === current && (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
