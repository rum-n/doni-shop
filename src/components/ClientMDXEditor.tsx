'use client';

import { MDXEditor } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  imagePlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  ListsToggle,
  InsertThematicBreak,
  InsertCodeBlock,
} from '@mdxeditor/editor';

interface ClientMDXEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

export default function ClientMDXEditor({ markdown, onChange }: ClientMDXEditorProps) {
  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        imagePlugin(),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', html: 'HTML' } }),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <BlockTypeSelect />
              <CreateLink />
              <InsertImage />
              <ListsToggle />
              <InsertThematicBreak />
              <InsertCodeBlock />
            </>
          )
        })
      ]}
      className="min-h-[400px]"
    />
  );
}