/**
 * docMarkdownParser.js
 * High-performance, zero-dependency Markdown parser and serializer for Lupis Engine documentation.
 * Converts between Markdown (with YAML frontmatter & directives) and the internal doc schema:
 * { title, category, description, sections: [{ id, title, blocks: [...] }] }
 */

/**
 * Serializes internal doc object to Markdown string
 * @param {Object} doc
 * @returns {string}
 */
export function docToMarkdown(doc) {
  if (!doc) return '';

  let md = '';

  // 1. Frontmatter
  md += '---\n';
  md += `title: "${(doc.title || '').replace(/"/g, '\\"')}"\n`;
  md += `category: "${(doc.category || '').replace(/"/g, '\\"')}"\n`;
  md += `description: "${(doc.description || '').replace(/"/g, '\\"')}"\n`;
  md += '---\n\n';

  // 2. Sections
  (doc.sections || []).forEach(sec => {
    md += `## ${sec.title} {#${sec.id}}\n\n`;

    (sec.blocks || []).forEach(block => {
      switch (block.type) {
        case 'text':
          md += `${block.content}\n\n`;
          break;

        case 'alert': {
          let callout = 'NOTE';
          if (block.variant === 'tip') callout = 'TIP';
          else if (block.variant === 'warning') callout = 'WARNING';
          else if (block.variant === 'danger') callout = 'CAUTION';
          else if (block.variant === 'info') callout = 'NOTE';

          const lines = (block.message || '').split('\n');
          md += `> [!${callout}]\n`;
          lines.forEach(l => {
            md += `> ${l}\n`;
          });
          md += '\n';
          break;
        }

        case 'features':
          md += ':::features\n';
          (block.items || []).forEach(item => {
            md += `- **${item.title}**: ${item.desc}\n`;
          });
          md += ':::\n\n';
          break;

        case 'steps':
          md += ':::steps\n';
          (block.items || []).forEach((item, idx) => {
            md += `${idx + 1}. ${item}\n`;
          });
          md += ':::\n\n';
          break;

        case 'shortcuts':
          md += ':::shortcuts\n';
          (block.items || []).forEach(item => {
            const keyStr = (item.keys || []).map(k => `\`${k}\``).join(' + ');
            md += `- ${keyStr}: ${item.description}\n`;
          });
          md += ':::\n\n';
          break;

        case 'code':
          md += `\`\`\`${block.language || ''}\n`;
          md += `${block.snippet || ''}\n`;
          md += '```\n\n';
          break;

        case 'table': {
          const headers = block.headers || [];
          const rows = block.rows || [];
          if (headers.length > 0) {
            md += `| ${headers.join(' | ')} |\n`;
            md += `| ${headers.map(() => '---').join(' | ')} |\n`;
            rows.forEach(row => {
              md += `| ${row.map(cell => (cell || '').replace(/\|/g, '\\|').replace(/\n/g, '<br>')).join(' | ')} |\n`;
            });
            md += '\n';
          }
          break;
        }

        case 'image': {
          const captionAttr = block.caption ? ` "${block.caption.replace(/"/g, '\\"')}"` : '';
          md += `![${block.alt || ''}](${block.url || ''}${captionAttr})\n\n`;
          break;
        }

        case 'video':
          md += ':::video\n';
          md += `url: ${block.url || ''}\n`;
          if (block.poster) md += `poster: ${block.poster}\n`;
          if (block.caption) md += `caption: ${block.caption}\n`;
          if (block.controls !== undefined) md += `controls: ${block.controls}\n`;
          if (block.autoplay !== undefined) md += `autoplay: ${block.autoplay}\n`;
          if (block.loop !== undefined) md += `loop: ${block.loop}\n`;
          if (block.muted !== undefined) md += `muted: ${block.muted}\n`;
          md += ':::\n\n';
          break;

        default:
          if (block.content) {
            md += `${block.content}\n\n`;
          }
      }
    });
  });

  return md.trim() + '\n';
}

/**
 * Parses Markdown string with frontmatter to internal doc object
 * @param {string} mdText
 * @returns {Object}
 */
export function parseMarkdownDoc(mdText) {
  if (!mdText || typeof mdText !== 'string') {
    return { title: '', category: '', description: '', sections: [] };
  }

  let title = '';
  let category = '';
  let description = '';
  let content = mdText;

  // 1. Frontmatter
  const frontmatterMatch = mdText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (frontmatterMatch) {
    const rawYaml = frontmatterMatch[1];
    content = mdText.slice(frontmatterMatch[0].length);

    const lines = rawYaml.split(/\r?\n/);
    let currentKey = null;
    let currentValue = [];

    for (const line of lines) {
      const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (keyMatch) {
        if (currentKey) {
          const val = currentValue.join('\n').trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
          if (currentKey === 'title') title = val;
          else if (currentKey === 'category') category = val;
          else if (currentKey === 'description') description = val;
        }
        currentKey = keyMatch[1];
        currentValue = [keyMatch[2]];
      } else if (currentKey) {
        currentValue.push(line);
      }
    }
    if (currentKey) {
      const val = currentValue.join('\n').trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
      if (currentKey === 'title') title = val;
      else if (currentKey === 'category') category = val;
      else if (currentKey === 'description') description = val;
    }
  }

  // 2. Sections: Split by '## '
  const sections = [];
  const sectionChunks = content.split(/(?=^##\s+)/m);

  for (const chunk of sectionChunks) {
    const trimmedChunk = chunk.trim();
    if (!trimmedChunk) continue;

    // Check if starts with ##
    const headerMatch = trimmedChunk.match(/^##\s+([^\r\n]+)/);
    if (!headerMatch) {
      // Content before first section (fallback description or lead)
      if (!description) {
        description = trimmedChunk;
      }
      continue;
    }

    let rawTitle = headerMatch[1].trim();
    let secId = '';

    // Check custom ID {#custom-id}
    const idMatch = rawTitle.match(/\{#([a-zA-Z0-9_-]+)\}\s*$/);
    if (idMatch) {
      secId = idMatch[1];
      rawTitle = rawTitle.replace(/\{#([a-zA-Z0-9_-]+)\}\s*$/, '').trim();
    } else {
      secId = rawTitle.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    }

    const secBody = trimmedChunk.slice(headerMatch[0].length).trim();
    const blocks = parseBlocks(secBody);

    sections.push({
      id: secId,
      title: rawTitle,
      blocks
    });
  }

  return {
    title,
    category,
    description,
    sections
  };
}

function parseBlocks(secBody) {
  if (!secBody) return [];
  const blocks = [];

  const lines = secBody.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // 1. Alert: > [!NOTE] or > [!TIP] or > [!WARNING] or > [!CAUTION] / > [!DANGER]
    const alertMatch = line.match(/^>\s*\[!(NOTE|INFO|TIP|WARNING|CAUTION|DANGER)\]/i);
    if (alertMatch) {
      const tag = alertMatch[1].toUpperCase();
      let variant = 'info';
      if (tag === 'TIP') variant = 'tip';
      else if (tag === 'WARNING') variant = 'warning';
      else if (tag === 'CAUTION' || tag === 'DANGER') variant = 'danger';

      const msgLines = [];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        msgLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'alert',
        variant,
        message: msgLines.join('\n').trim()
      });
      continue;
    }

    // 2. Fenced directives :::features, :::steps, :::shortcuts, :::video
    const directiveMatch = line.match(/^:::([a-z_-]+)/i);
    if (directiveMatch) {
      const type = directiveMatch[1].toLowerCase();
      const directiveLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        directiveLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing :::

      if (type === 'features') {
        const items = [];
        for (const dLine of directiveLines) {
          const itemMatch = dLine.match(/^[-*]\s+\*\*([^*]+)\*\*:\s*(.*)$/);
          if (itemMatch) {
            items.push({
              title: itemMatch[1].trim(),
              desc: itemMatch[2].trim()
            });
          }
        }
        blocks.push({ type: 'features', items });
      } else if (type === 'steps') {
        const items = [];
        for (const dLine of directiveLines) {
          const stepMatch = dLine.match(/^\d+\.\s+(.*)$/);
          if (stepMatch) {
            items.push(stepMatch[1].trim());
          } else if (dLine.trim() && items.length > 0) {
            items[items.length - 1] += ' ' + dLine.trim();
          }
        }
        blocks.push({ type: 'steps', items });
      } else if (type === 'shortcuts') {
        const items = [];
        for (const dLine of directiveLines) {
          const scMatch = dLine.match(/^[-*]\s+(.+?):\s*(.*)$/);
          if (scMatch) {
            const rawKeys = scMatch[1];
            const desc = scMatch[2].trim();
            const keys = [];
            const keyRegex = /`([^`]+)`/g;
            let m;
            while ((m = keyRegex.exec(rawKeys)) !== null) {
              const subKeys = m[1].split(/\s*\+\s*/);
              subKeys.forEach(k => keys.push(k.trim()));
            }
            if (keys.length === 0) {
              rawKeys.split(/\s*\+\s*/).forEach(k => keys.push(k.replace(/[`*]/g, '').trim()));
            }
            items.push({ keys, description: desc });
          }
        }
        blocks.push({ type: 'shortcuts', items });
      } else if (type === 'video') {
        const vObj = { type: 'video' };
        for (const dLine of directiveLines) {
          const kvMatch = dLine.match(/^([a-zA-Z_-]+):\s*(.*)$/);
          if (kvMatch) {
            const k = kvMatch[1].trim();
            let v = kvMatch[2].trim();
            if (v === 'true') v = true;
            else if (v === 'false') v = false;
            vObj[k] = v;
          }
        }
        blocks.push(vObj);
      }
      continue;
    }

    // 3. Code block: ```language
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      blocks.push({
        type: 'code',
        language: lang,
        snippet: codeLines.join('\n')
      });
      continue;
    }

    // 4. Table: Starts with |
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (rowLine) => {
          return rowLine
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split(/(?<!\\)\|/)
            .map(c => c.trim().replace(/\\\|/g, '|').replace(/<br>/g, '\n'));
        };
        const headers = parseRow(tableLines[0]);
        const rows = tableLines.slice(2).map(parseRow);
        blocks.push({
          type: 'table',
          headers,
          rows
        });
      }
      continue;
    }

    // 5. Image: ![Alt](url "Caption") or ![Alt](url)
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)$/);
    if (imgMatch) {
      blocks.push({
        type: 'image',
        alt: imgMatch[1],
        url: imgMatch[2],
        caption: imgMatch[3] || ''
      });
      i++;
      continue;
    }

    // 6. Text Paragraph: Collect lines until blank line or next block starter
    const textLines = [line];
    i++;
    while (i < lines.length && 
           lines[i].trim() && 
           !lines[i].startsWith('>') && 
           !lines[i].startsWith(':::') && 
           !lines[i].startsWith('```') && 
           !lines[i].startsWith('|') && 
           !lines[i].startsWith('![') && 
           !lines[i].startsWith('##')) {
      textLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: 'text',
      content: textLines.join('\n').trim()
    });
  }

  return blocks;
}
