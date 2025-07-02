/**
 * Utility functions for the application
 */

// Format thematic tags function - moved from BrowseByYearsScreen for reuse
export const formatThematicTags = (thematicTags: Array<{tag: string, importance: number}> | null | undefined): string => {
  if (!thematicTags || thematicTags.length === 0) {
    return 'Dramat'; // Fallback
  }
  
  // Sort by importance (highest first) and take top 3
  const sortedTags = thematicTags
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, 3)
    .map(tagObj => tagObj.tag);
  
  return sortedTags.join(', ');
};