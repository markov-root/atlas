// src/utils/remark-glossary.js - Remark plugin for automatic glossary term detection

import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

/**
 * Remark plugin that automatically detects glossary terms and wraps them with tooltip components
 */
export default function remarkGlossary(options = {}) {
  const {
    glossaryDir = './src/data/glossary',
    caseSensitive = false,
    excludeNodes = ['code', 'inlineCode', 'link', 'heading']
  } = options;

  return async (tree, file) => {
    // Load and merge all glossary-*.json files from the directory
    let glossaryData = {};
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const fullDir = path.resolve(glossaryDir);
      
      // Read directory contents
      const files = await fs.readdir(fullDir);
      
      // Filter for glossary-*.json files
      const glossaryFiles = files.filter(file => 
        file.startsWith('glossary-') && file.endsWith('.json')
      );
      
      console.log(`Found ${glossaryFiles.length} glossary files:`, glossaryFiles);
      
      // Load and merge all glossary files
      for (const filename of glossaryFiles) {
        try {
          const filePath = path.join(fullDir, filename);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const fileData = JSON.parse(fileContent);
          
          // Merge into main glossary data
          Object.assign(glossaryData, fileData);
          console.log(`Loaded ${Object.keys(fileData).length} terms from ${filename}`);
        } catch (error) {
          console.warn(`Warning: Could not load glossary file ${filename}:`, error.message);
        }
      }
      
      console.log(`Total glossary terms loaded: ${Object.keys(glossaryData).length}`);
      
    } catch (error) {
      console.warn(`Warning: Could not load glossary from ${glossaryDir}:`, error.message);
      return tree;
    }

    // If no terms loaded, skip processing
    if (Object.keys(glossaryData).length === 0) {
      console.warn('No glossary terms found, skipping processing');
      return tree;
    }

    // Create regex patterns for all terms AND their aliases
    const termPatterns = [];
    
    Object.keys(glossaryData).forEach(term => {
      const data = glossaryData[term];
      const allTerms = [term]; // Start with the main term
      
      // Add aliases if they exist
      if (data.aliases && Array.isArray(data.aliases)) {
        allTerms.push(...data.aliases);
      }
      
      // Create patterns for each term and alias
      allTerms.forEach(termVariant => {
        const escapedTerm = termVariant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        termPatterns.push({
          term: term,
          variant: termVariant,
          regex: new RegExp('\\b' + escapedTerm + '\\b', caseSensitive ? 'g' : 'gi'),
          definition: data
        });
      });
    });

    // Sort by term length (longest first) to avoid partial matches
    termPatterns.sort((a, b) => b.variant.length - a.variant.length);

    // Track processed nodes to avoid double-processing
    const processedNodes = new Set();

    visit(tree, 'text', (node, index, parent) => {
      // Skip if parent is in excluded nodes
      if (!parent || excludeNodes.includes(parent.type) || processedNodes.has(node)) {
        return;
      }

      let text = node.value;
      let hasMatches = false;
      const replacements = [];

      // Find all term matches in the text
      for (const { term, variant, regex, definition } of termPatterns) {
        let match;
        regex.lastIndex = 0; // Reset regex state
        
        while ((match = regex.exec(text)) !== null) {
          hasMatches = true;
          replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            term,
            matchedText: match[0],
            definition
          });
        }
      }

      if (!hasMatches) return;

      // Sort replacements by position (reverse order for easier processing)
      replacements.sort((a, b) => b.start - a.start);

      // Remove overlapping matches (keep the first/longest match)
      const filteredReplacements = [];
      for (const replacement of replacements) {
        const hasOverlap = filteredReplacements.some(existing => 
          (replacement.start < existing.end && replacement.end > existing.start)
        );
        if (!hasOverlap) {
          filteredReplacements.unshift(replacement);
        }
      }

      if (filteredReplacements.length === 0) return;

      // Create new nodes array
      const newNodes = [];
      let lastIndex = 0;

      for (const replacement of filteredReplacements) {
        // Add text before the match
        if (replacement.start > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, replacement.start)
          });
        }

        // Create glossary tooltip component
        const glossaryNode = {
          type: 'mdxJsxTextElement',
          name: 'GlossaryTerm',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'term',
              value: replacement.term
            },
            {
              type: 'mdxJsxAttribute',
              name: 'definition',
              value: typeof replacement.definition === 'string' 
                ? replacement.definition 
                : JSON.stringify(replacement.definition)
            }
          ],
          children: [
            {
              type: 'text',
              value: replacement.matchedText
            }
          ]
        };

        newNodes.push(glossaryNode);
        lastIndex = replacement.end;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex)
        });
      }

      // Mark all new nodes as processed
      newNodes.forEach(node => processedNodes.add(node));

      // Replace the original text node with the new nodes
      parent.children.splice(index, 1, ...newNodes);
    });

    return tree;
  };
}
