'use client';

/**
 * Rich Text Editor Component
 * WYSIWYG editor for recipe/preparation method using TipTap
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import {
  Bold, Italic, Strikethrough,
  List, ListOrdered, Heading3, Link2, Eraser,
} from 'lucide-react';
import { sanitizeRecipeHtml, containsDangerousContent } from '@/lib/sanitization';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter your recipe or preparation method...',
  maxLength = 5000,
  disabled = false,
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3, 4], // Only allow h3 and h4
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: (href) => /^https?:\/\//.test(href), // Only allow http(s) links
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      // Sanitize on update
      const sanitized = sanitizeRecipeHtml(html);

      // Check for dangerous content
      if (containsDangerousContent(html)) {
        console.warn('Dangerous content detected and blocked');
        return;
      }

      onChange(sanitized);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2',
      },
      // Sanitize pasted content
      transformPastedHTML: (html) => {
        return sanitizeRecipeHtml(html);
      },
    },
  });

  // Update editor when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.getText().length;
  const isOverLimit = characterCount > maxLength;

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleStrike = () => editor.chain().focus().toggleStrike().run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleHeading3 = () => editor.chain().focus().toggleHeading({ level: 3 }).run();

  const setLink = () => {
    const url = window.prompt('Enter URL (must start with http:// or https://)');

    if (url === null) return; // Cancelled

    if (url === '') {
      // Remove link
      editor.chain().focus().unsetLink().run();
      return;
    }

    // Validate URL
    if (!/^https?:\/\//.test(url)) {
      alert('URL must start with http:// or https://');
      return;
    }

    // Set link
    editor.chain().focus().setLink({ href: url }).run();
  };

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={toggleBold}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Bold"
          aria-label="Bold"
        >
          <Bold size={18} />
        </button>

        <button
          type="button"
          onClick={toggleItalic}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Italic"
          aria-label="Italic"
        >
          <Italic size={18} />
        </button>

        <button
          type="button"
          onClick={toggleStrike}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('strike') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={toggleHeading3}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Heading"
          aria-label="Heading 3"
        >
          <Heading3 size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={toggleBulletList}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Bullet List"
          aria-label="Bullet List"
        >
          <List size={18} />
        </button>

        <button
          type="button"
          onClick={toggleOrderedList}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Numbered List"
          aria-label="Numbered List"
        >
          <ListOrdered size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('link') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Insert Link"
          aria-label="Insert Link"
        >
          <Link2 size={18} />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={clearFormatting}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Clear Formatting"
          aria-label="Clear Formatting"
        >
          <Eraser size={18} />
        </button>

        {/* Character Counter */}
        <div className="ml-auto flex items-center text-sm">
          <span className={isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {characterCount} / {maxLength}
          </span>
        </div>
      </div>

      {/* Editor Content */}
      <div className={`bg-white ${disabled ? 'bg-gray-50' : ''}`}>
        <EditorContent editor={editor} />
      </div>

      {/* Error Message */}
      {isOverLimit && (
        <div className="bg-red-50 border-t border-red-200 px-3 py-2 text-sm text-red-600">
          Content exceeds maximum length of {maxLength} characters
        </div>
      )}

      {/* Help Text */}
      <div className="bg-gray-50 border-t border-gray-300 px-3 py-2 text-xs text-gray-500">
        {placeholder}
      </div>
    </div>
  );
}
