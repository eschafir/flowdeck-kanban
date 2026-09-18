"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { fileToDataUrl, isImageFile } from "@/lib/imageUtils";
import { RichTextToolbar } from "./RichTextToolbar";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

function toEditorContent(content: string): string {
  if (!content) return "<p></p>";
  return content.includes("<") ? content : `<p>${content}</p>`;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [notice, setNotice] = useState<string | null>(null);
  // Paste/drop handlers are created before the editor exists, so they call
  // through this ref, which is filled in once the editor is ready.
  const addImagesRef = useRef<(files: File[], pos?: number) => void>(
    () => {}
  );

  const editor = useEditor({
    extensions: [
      // StarterKit already bundles Underline and Link.
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ allowBase64: true }),
    ],
    content: toEditorContent(content),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[200px] px-3 py-2 text-sm leading-relaxed text-[var(--dark-navy)] outline-none",
        "data-testid": "card-editor-details",
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(
          isImageFile
        );
        if (files.length === 0) return false;
        event.preventDefault();
        addImagesRef.current(files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter(
          isImageFile
        );
        if (files.length === 0) return false;
        event.preventDefault();
        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        addImagesRef.current(files, coords?.pos);
        return true;
      },
      // Cmd/Ctrl-click follows a link; a plain click just places the cursor.
      handleClick: (_view, _pos, event) => {
        if (!(event.metaKey || event.ctrlKey)) return false;
        const anchor = (event.target as HTMLElement).closest("a");
        const href = anchor?.getAttribute("href");
        if (!href) return false;
        window.open(href, "_blank", "noopener,noreferrer");
        return true;
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  const addImages = useCallback(
    async (files: File[], pos?: number) => {
      if (!editor) return;
      setNotice(null);
      let insertAt = pos;
      for (const file of files) {
        try {
          const src = await fileToDataUrl(file);
          const chain = editor.chain().focus();
          if (insertAt === undefined) {
            chain.setImage({ src }).run();
          } else {
            chain.insertContentAt(insertAt, { type: "image", attrs: { src } }).run();
            // Later images land after this one instead of stacking at the same spot.
            insertAt += 1;
          }
        } catch (error) {
          setNotice(
            error instanceof Error ? error.message : "Could not add the image."
          );
        }
      }
    },
    [editor]
  );

  useEffect(() => {
    addImagesRef.current = (files, pos) => {
      void addImages(files, pos);
    };
  }, [addImages]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--panel)]">
      <RichTextToolbar
        editor={editor}
        onUploadImages={(files) => void addImages(files)}
      />
      {notice ? (
        <p
          role="alert"
          data-testid="card-editor-notice"
          className="border-b border-[var(--border-subtle)] px-3 py-1.5 text-xs text-red-500"
        >
          {notice}
        </p>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
