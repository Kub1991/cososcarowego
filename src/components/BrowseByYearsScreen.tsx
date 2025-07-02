Here's the fixed version with all missing closing brackets added:

```typescript
// At the end of the component, after the parseBriefSections function
export default BrowseByYearsScreen;
```

The main issue was that the component was missing its final closing bracket. The file should end with:

```typescript
const parseBriefSections = (briefText: string) => {
  if (!briefText) return [];
  
  // Split by lines and process
  const lines = briefText.split('\n');
  const sections = [];
  let currentSection = { title: '', content: '' };
  
  for (const line of lines) {
    // Check if line is a header (starts with emoji and has ** around text)
    const headerMatch = line.match(/^(.+?)\s*\*\*(.+?)\*\*/);
    
    if (headerMatch) {
      // Save previous section if it has content
      if (currentSection.title || currentSection.content.trim()) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.trim()
        });
      }
      
      // Start new section
      currentSection = {
        title: headerMatch[2], // Only use the text part, skip the emoji
        content: ''
      };
    } else if (line.trim()) {
      // Add content to current section
      if (currentSection.content) {
        currentSection.content += '\n';
      }
      currentSection.content += line;
    }
  }
  
  // Add the last section
  if (currentSection.title || currentSection.content.trim()) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.trim()
    });
  }
  
  // If no sections were found (no headers), return the entire text as one section
  if (sections.length === 0) {
    sections.push({
      title: '',
      content: briefText.trim()
    });
  }
  
  return sections;
};

export default BrowseByYearsScreen;
```