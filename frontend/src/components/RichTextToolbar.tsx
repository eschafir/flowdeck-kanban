"use client";

import { useRef, useState, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { normalizeUrl } from "@/lib/urlUtils";

type Panel = "link" | "image" | "color" | "highlight" | null;

const FONT_SIZES = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "" },
  { label: "Large", value: "18px" },
  { label: "Huge", value: "24px" },
];

const BLOCK_STYLES = [
  { label: "Paragraph", value: "0" },
  { label: "Heading 1", value: "1" },
  { label: "Heading 2", value: "2" },
  { label: "Heading 3", value: "3" },
];

// Mid-tone colors that stay readable on both the light and dark theme.
const TEXT_COLORS = [
  { name: "Red", value: "#e5484d" },
  { name: "Orange", value: "#f76b15" },
  { name: "Green", value: "#30a46c" },
  { name: "Blue", value: "#3e63dd" },
  { name: "Purple", value: "#8e4ec6" },
];

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "rgba(236, 173, 10, 0.4)" },
  { name: "Blue", value: "rgba(32, 157, 215, 0.35)" },
  { name: "Green", value: "rgba(48, 164, 108, 0.35)" },
  { name: "Pink", value: "rgba(233, 30, 99, 0.3)" },
];

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  testId,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      // Keep the caret/selection in the editor while a formatting button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      data-testid={testId}
      className={`min-w-7 rounded px-2 py-1 text-xs font-semibold tracking-wide transition-colors disabled:opacity-35 ${
        active
          ? "bg-[var(--blue-primary)] text-white"
          : "text-[var(--dark-navy)] hover:bg-[var(--blue-primary)]/10"
      }`}
    >
      {children ?? label}
    </button>
  );
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="mx-1 h-5 w-px self-center bg-[var(--border-subtle)]"
    />
  );
}

function ToolbarSelect({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  testId: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      data-testid={testId}
      className="rounded border border-[var(--border-subtle)] bg-[var(--panel)] px-1.5 py-1 text-xs text-[var(--dark-navy)] outline-none focus:border-[var(--blue-primary)]"
    >
      {options.map((option) => (
        <option key={option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function AlignIcon({ align }: { align: "left" | "center" | "right" }) {
  const lines =
    align === "left"
      ? [
          [2, 14],
          [2, 10],
          [2, 14],
        ]
      : align === "center"
        ? [
            [1, 15],
            [3, 13],
            [1, 15],
          ]
        : [
            [2, 14],
            [6, 14],
            [2, 14],
          ];
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
      {lines.map(([x1, x2], index) => (
        <line
          key={index}
          x1={x1}
          x2={x2}
          y1={2 + index * 5}
          y2={2 + index * 5}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

type RichTextToolbarProps = {
  editor: Editor;
  onUploadImages: (files: File[]) => void;
};

export function RichTextToolbar({ editor, onUploadImages }: RichTextToolbarProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      blockquote: current.isActive("blockquote"),
      codeBlock: current.isActive("codeBlock"),
      link: current.isActive("link"),
      linkHref: (current.getAttributes("link").href as string | undefined) ?? "",
      heading:
        [1, 2, 3].find((level) => current.isActive("heading", { level })) ?? 0,
      fontSize:
        (current.getAttributes("textStyle").fontSize as string | undefined) ??
        "",
      alignCenter: current.isActive({ textAlign: "center" }),
      alignRight: current.isActive({ textAlign: "right" }),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  const alignLeft = !state.alignCenter && !state.alignRight;
  const fontSizeValue = FONT_SIZES.some((size) => size.value === state.fontSize)
    ? state.fontSize
    : "";

  function togglePanel(next: Exclude<Panel, null>) {
    setUrlError(null);
    if (panel === next) {
      setPanel(null);
      return;
    }
    if (next === "link") setUrl(state.linkHref);
    if (next === "image") setUrl("");
    setPanel(next);
  }

  function closePanel() {
    setPanel(null);
    setUrlError(null);
    editor.chain().focus().run();
  }

  function applyLink() {
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      closePanel();
      return;
    }
    const href = normalizeUrl(url, { allowMailto: true });
    if (!href) {
      setUrlError("Enter a valid http, https, or mailto link.");
      return;
    }
    const { empty } = editor.state.selection;
    if (empty && !state.link) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: href,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    closePanel();
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    closePanel();
  }

  function applyImageUrl() {
    const src = normalizeUrl(url, { allowDataImage: true });
    if (!src) {
      setUrlError("Enter a valid http or https image URL.");
      return;
    }
    editor.chain().focus().setImage({ src }).run();
    closePanel();
  }

  function pickColor(value: string | null) {
    const chain = editor.chain().focus();
    if (panel === "highlight") {
      (value ? chain.setHighlight({ color: value }) : chain.unsetHighlight()).run();
    } else {
      (value ? chain.setColor(value) : chain.unsetColor()).run();
    }
    setPanel(null);
  }

  function handleBlockStyle(value: string) {
    const level = Number(value);
    const chain = editor.chain().focus();
    if (level === 0) {
      chain.setParagraph().run();
    } else {
      chain.setHeading({ level: level as 1 | 2 | 3 }).run();
    }
  }

  function handleFontSize(value: string) {
    const chain = editor.chain().focus();
    (value ? chain.setFontSize(value) : chain.unsetFontSize()).run();
  }

  const swatches =
    panel === "highlight"
      ? { items: HIGHLIGHT_COLORS, reset: "No highlight", prefix: "Highlight" }
      : { items: TEXT_COLORS, reset: "Default color", prefix: "Text color" };

  return (
    <div
      className="border-b border-[var(--border-subtle)] bg-[var(--column-bg)]"
      data-testid="card-editor-toolbar"
    >
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
        <ToolbarSelect
          label="Block style"
          value={String(state.heading)}
          onChange={handleBlockStyle}
          options={BLOCK_STYLES}
          testId="toolbar-block-style"
        />
        <ToolbarSelect
          label="Font size"
          value={fontSizeValue}
          onChange={handleFontSize}
          options={FONT_SIZES}
          testId="toolbar-font-size"
        />
        <Divider />
        <ToolbarButton
          label="Bold"
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton
          label="Text color"
          active={panel === "color"}
          onClick={() => togglePanel("color")}
          testId="toolbar-color"
        >
          <span className="border-b-2 border-[var(--purple-secondary)]">A</span>
        </ToolbarButton>
        <ToolbarButton
          label="Highlight"
          active={panel === "highlight"}
          onClick={() => togglePanel("highlight")}
          testId="toolbar-highlight"
        >
          <span className="rounded-sm bg-[var(--accent-yellow)]/60 px-0.5">
            H
          </span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Align left"
          active={alignLeft}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignIcon align="left" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={state.alignCenter}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignIcon align="center" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={state.alignRight}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignIcon align="right" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Bullets"
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          testId="toolbar-bullets"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          label="Numbers"
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “ ”
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={state.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          {"</>"}
        </ToolbarButton>
        <ToolbarButton
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          ―
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Link"
          active={state.link || panel === "link"}
          onClick={() => togglePanel("link")}
          testId="toolbar-link"
        >
          Link
        </ToolbarButton>
        <ToolbarButton
          label="Image"
          active={panel === "image"}
          onClick={() => togglePanel("image")}
          testId="toolbar-image"
        >
          Image
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Undo"
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </ToolbarButton>
      </div>

      {panel === "link" || panel === "image" ? (
        <div
          className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] px-2 py-1.5"
          data-testid="toolbar-url-panel"
        >
          <input
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setUrlError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (panel === "link") applyLink();
                else applyImageUrl();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closePanel();
              }
            }}
            autoFocus
            placeholder={panel === "link" ? "https://example.com" : "Image URL"}
            aria-label={panel === "link" ? "Link URL" : "Image URL"}
            data-testid="card-editor-url-input"
            className="min-w-0 flex-1 rounded border border-[var(--border-subtle)] bg-[var(--panel)] px-2 py-1 text-xs text-[var(--dark-navy)] outline-none focus:border-[var(--blue-primary)]"
          />
          <button
            type="button"
            onClick={panel === "link" ? applyLink : applyImageUrl}
            data-testid="card-editor-url-apply"
            className="rounded bg-[var(--purple-secondary)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
          >
            {panel === "link" ? "Apply" : "Insert"}
          </button>
          {panel === "image" ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              data-testid="card-editor-image-upload"
              className="rounded border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--dark-navy)] hover:bg-[var(--blue-primary)]/10"
            >
              Upload…
            </button>
          ) : null}
          {panel === "link" && state.link ? (
            <button
              type="button"
              onClick={removeLink}
              data-testid="card-editor-link-remove"
              className="rounded px-2 py-1 text-xs text-[var(--gray-text)] hover:text-red-500"
            >
              Remove link
            </button>
          ) : null}
          <button
            type="button"
            onClick={closePanel}
            className="rounded px-2 py-1 text-xs text-[var(--gray-text)] hover:text-[var(--dark-navy)]"
          >
            Cancel
          </button>
          {urlError ? (
            <p role="alert" className="w-full text-xs text-red-500">
              {urlError}
            </p>
          ) : null}
        </div>
      ) : null}

      {panel === "color" || panel === "highlight" ? (
        <div
          className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] px-2 py-1.5"
          data-testid="toolbar-color-panel"
        >
          {swatches.items.map((swatch) => (
            <button
              key={swatch.name}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pickColor(swatch.value)}
              aria-label={`${swatches.prefix} ${swatch.name}`}
              title={swatch.name}
              className="h-5 w-5 rounded-full border border-[var(--border-subtle)]"
              style={{ backgroundColor: swatch.value }}
            />
          ))}
          <button
            type="button"
            onClick={() => pickColor(null)}
            className="rounded px-2 py-0.5 text-xs text-[var(--gray-text)] hover:text-[var(--dark-navy)]"
          >
            {swatches.reset}
          </button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        data-testid="card-editor-image-input"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) {
            onUploadImages(files);
            setPanel(null);
          }
        }}
      />
    </div>
  );
}
