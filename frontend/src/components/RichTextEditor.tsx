"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active
          ? "bg-[var(--blue-primary)] text-white"
          : "text-[var(--dark-navy)] hover:bg-[var(--blue-primary)]/10"
      }`}
    >
      {label}
    </button>
  );
}

function toEditorContent(content: string): string {
  if (!content) return "<p></p>";
  return content.includes("<") ? content : `<p>${content}</p>`;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: toEditorContent(content),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[200px] px-3 py-2 text-sm leading-relaxed text-[var(--dark-navy)] outline-none",
        "data-testid": "card-editor-details",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--panel)]">
      <div
        className="flex flex-wrap gap-1 border-b border-[var(--border-subtle)] bg-[var(--column-bg)] px-2 py-1.5"
        data-testid="card-editor-toolbar"
      >
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="Bullets"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Numbers"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
