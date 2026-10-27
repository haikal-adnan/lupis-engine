import { describe, it, expect } from 'vitest';
import { parseMarkdownDoc, docToMarkdown } from '@/features/docs/utils/docMarkdownParser.js';

describe('docMarkdownParser', () => {
  it('serializes doc object to markdown with frontmatter, sections, and blocks', () => {
    const doc = {
      title: 'Test Document',
      category: 'Testing',
      description: 'A test documentation page.',
      sections: [
        {
          id: 'test-section',
          title: 'Test Section',
          blocks: [
            { type: 'text', content: 'Normal paragraph with **bold** text.' },
            { type: 'alert', variant: 'tip', message: 'Tip message here.' },
            {
              type: 'features',
              items: [{ title: 'Fast', desc: 'Runs quickly.' }]
            },
            {
              type: 'steps',
              items: ['First step', 'Second step']
            },
            {
              type: 'shortcuts',
              items: [{ keys: ['Ctrl', 'S'], description: 'Save' }]
            },
            {
              type: 'code',
              language: 'javascript',
              snippet: 'const a = 10;'
            },
            {
              type: 'table',
              headers: ['Header 1', 'Header 2'],
              rows: [['Val 1', 'Val 2']]
            },
            {
              type: 'image',
              alt: 'Sample',
              url: 'test.png',
              caption: 'Sample Caption'
            },
            {
              type: 'video',
              url: 'test.mp4',
              poster: 'thumb.jpg',
              caption: 'Video Caption',
              controls: true
            }
          ]
        }
      ]
    };

    const md = docToMarkdown(doc);
    expect(md).toContain('title: "Test Document"');
    expect(md).toContain('category: "Testing"');
    expect(md).toContain('## Test Section {#test-section}');
    expect(md).toContain('> [!TIP]');
    expect(md).toContain(':::features');
    expect(md).toContain(':::steps');
    expect(md).toContain(':::shortcuts');
    expect(md).toContain('```javascript');
    expect(md).toContain('| Header 1 | Header 2 |');
    expect(md).toContain('![Sample](test.png "Sample Caption")');
    expect(md).toContain(':::video');

    const parsed = parseMarkdownDoc(md);
    expect(parsed.title).toBe(doc.title);
    expect(parsed.category).toBe(doc.category);
    expect(parsed.description).toBe(doc.description);
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].id).toBe('test-section');
    expect(parsed.sections[0].title).toBe('Test Section');
    expect(parsed.sections[0].blocks).toHaveLength(9);

    expect(parsed.sections[0].blocks[0].type).toBe('text');
    expect(parsed.sections[0].blocks[1].type).toBe('alert');
    expect(parsed.sections[0].blocks[1].variant).toBe('tip');
    expect(parsed.sections[0].blocks[2].type).toBe('features');
    expect(parsed.sections[0].blocks[3].type).toBe('steps');
    expect(parsed.sections[0].blocks[4].type).toBe('shortcuts');
    expect(parsed.sections[0].blocks[5].type).toBe('code');
    expect(parsed.sections[0].blocks[6].type).toBe('table');
    expect(parsed.sections[0].blocks[7].type).toBe('image');
    expect(parsed.sections[0].blocks[8].type).toBe('video');
  });

  it('handles empty or malformed input safely', () => {
    expect(parseMarkdownDoc('')).toEqual({
      title: '',
      category: '',
      description: '',
      sections: []
    });
    expect(parseMarkdownDoc(null)).toEqual({
      title: '',
      category: '',
      description: '',
      sections: []
    });
    expect(docToMarkdown(null)).toBe('');
  });
});
