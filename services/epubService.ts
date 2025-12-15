import JSZip from 'jszip';

// Helper to extract text with better formatting preservation
// Walks the DOM tree and inserts newlines for block-level elements
const extractReadableText = (htmlContent: string): string => {
  const parser = new DOMParser();
  // Parse as HTML (more lenient than application/xhtml+xml)
  const doc = parser.parseFromString(htmlContent, "text/html");

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      // Skip non-content tags
      if (['script', 'style', 'svg', 'noscript', 'meta', 'link', 'head'].includes(tag)) {
        return '';
      }

      let content = '';
      const childNodes = Array.from(node.childNodes);
      for (const child of childNodes) {
        content += walk(child);
      }

      // Clean up internal whitespace: collapse tabs/newlines into single space
      content = content.replace(/[\t\r\n]+/g, ' ');

      // Add structure based on tags
      // Block elements: Surround with newlines
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'section', 'article', 'main', 'header', 'footer'].includes(tag)) {
        return `\n${content.trim()}\n`;
      }
      // Explicit Line breaks
      if (tag === 'br') return '\n';
      // Table rows
      if (tag === 'tr') return `\n${content.trim()}`;
      // Table cells
      if (tag === 'td' || tag === 'th') return ` ${content.trim()} `;
      
      return content;
    }
    return '';
  };

  // Walk the body
  const rawText = walk(doc.body || doc.documentElement);
  
  // Final Cleanup: Normalize multiple newlines to max 2 to preserve paragraph separation without massive gaps
  return rawText.replace(/\n{3,}/g, '\n\n').trim();
};

// Helper to resolve paths relative to the OPF directory
// e.g. base: "OEBPS/", relative: "../Images/cover.jpg" -> "Images/cover.jpg"
const resolvePath = (baseDir: string, relativePath: string): string => {
  if (relativePath.startsWith('/')) return relativePath.substring(1); 
  
  const stack = baseDir.split('/').filter(p => p.length > 0);
  const parts = relativePath.split('/');

  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  
  return stack.join('/');
};

export const parseEpub = async (file: File): Promise<string> => {
  try {
    const zip = await JSZip.loadAsync(file);
    
    // 1. Find the OPF file path from META-INF/container.xml
    const containerFile = zip.file("META-INF/container.xml");
    if (!containerFile) throw new Error("META-INF/container.xml not found. This does not appear to be a valid EPUB.");
    
    const containerXml = await containerFile.async("text");
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, "application/xml");
    
    const rootFile = containerDoc.querySelector("rootfile");
    if (!rootFile) throw new Error("Invalid EPUB: No <rootfile> defined in container.xml");

    const opfPath = rootFile.getAttribute("full-path");
    if (!opfPath) throw new Error("Invalid EPUB: Rootfile missing full-path attribute");

    // 2. Read the OPF file
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);

    const opfXml = await opfFile.async("text");
    const opfDoc = parser.parseFromString(opfXml, "application/xml");
    
    if (opfDoc.querySelector("parsererror")) throw new Error("Failed to parse OPF XML structure");

    // 3. Parse Manifest (ID -> Href)
    const manifest = opfDoc.querySelector("manifest");
    if (!manifest) throw new Error("Invalid EPUB: OPF manifest missing");

    const idToHref: Record<string, string> = {};
    const items = Array.from(manifest.querySelectorAll("item"));
    items.forEach(item => {
      const id = item.getAttribute("id");
      const href = item.getAttribute("href");
      if (id && href) {
        idToHref[id] = href;
      }
    });

    // 4. Parse Spine (Order of IDs)
    const spine = opfDoc.querySelector("spine");
    if (!spine) throw new Error("Invalid EPUB: OPF spine missing");

    const itemrefs = Array.from(spine.querySelectorAll("itemref"));
    
    // 5. Extract Text in Spine Order
    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    const textParts: string[] = [];

    for (const itemref of itemrefs) {
      const idref = itemref.getAttribute("idref");
      if (!idref) continue;

      const relativeHref = idToHref[idref];
      if (!relativeHref) continue;

      // Resolve full path in zip
      const fullPath = resolvePath(opfDir, relativeHref);
      
      // Handle URL encoding (common in EPUBs)
      // Try exact match first, then decoded, then encoded
      let fileInZip = zip.file(fullPath) || zip.file(decodeURIComponent(fullPath));

      if (fileInZip) {
        const content = await fileInZip.async("text");
        const readableText = extractReadableText(content);
        if (readableText.length > 0) {
          textParts.push(readableText);
        }
      }
    }

    // 6. Final Assembly
    if (textParts.length === 0) {
      throw new Error("No readable text content found in EPUB structure.");
    }

    return textParts.join("\n\n------------------- CHAPTER BREAK -------------------\n\n");

  } catch (e: any) {
    console.error("EPUB Parsing Error:", e);
    throw new Error(`Failed to process EPUB: ${e.message}`);
  }
};