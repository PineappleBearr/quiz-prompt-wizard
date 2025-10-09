import { Transform } from "@/types/question";

/**
 * Parse OpenGL transformation code into Transform array
 * Supports glTranslatef(x, y, z) and glRotatef(angle, x, y, z)
 */
export function parseOpenGLCode(code: string): Transform[] {
  const transforms: Transform[] = [];
  
  // Remove extra whitespace and normalize
  const normalizedCode = code.trim();
  
  // Match glTranslatef calls
  const translateRegex = /glTranslatef\s*\(\s*([-.\d]+)\s*,\s*([-.\d]+)\s*,\s*([-.\d]+)\s*\)/gi;
  
  // Match glRotatef calls
  const rotateRegex = /glRotatef\s*\(\s*([-.\d]+)\s*,\s*([-.\d]+)\s*,\s*([-.\d]+)\s*,\s*([-.\d]+)\s*\)/gi;
  
  // Find all transformations with their positions
  const allMatches: { type: 'translate' | 'rotate', params: number[], index: number }[] = [];
  
  let match;
  
  // Find all translate calls
  while ((match = translateRegex.exec(normalizedCode)) !== null) {
    allMatches.push({
      type: 'translate',
      params: [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])],
      index: match.index
    });
  }
  
  // Find all rotate calls
  while ((match = rotateRegex.exec(normalizedCode)) !== null) {
    allMatches.push({
      type: 'rotate',
      params: [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4])],
      index: match.index
    });
  }
  
  // Sort by position in code to maintain order
  allMatches.sort((a, b) => a.index - b.index);
  
  // Convert to Transform array
  return allMatches.map(m => ({
    type: m.type,
    params: m.params
  }));
}

/**
 * Compare two transform sequences for equality
 * Allows for small floating point differences
 */
export function compareTransforms(seq1: Transform[], seq2: Transform[], tolerance = 0.1): boolean {
  if (seq1.length !== seq2.length) return false;
  
  for (let i = 0; i < seq1.length; i++) {
    const t1 = seq1[i];
    const t2 = seq2[i];
    
    if (t1.type !== t2.type) return false;
    if (t1.params.length !== t2.params.length) return false;
    
    for (let j = 0; j < t1.params.length; j++) {
      if (Math.abs(t1.params[j] - t2.params[j]) > tolerance) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Format transform sequence as OpenGL code
 */
export function formatAsOpenGLCode(transforms: Transform[]): string {
  return transforms.map(t => {
    if (t.type === "translate") {
      return `glTranslatef(${t.params[0].toFixed(1)}, ${t.params[1].toFixed(1)}, ${t.params[2].toFixed(1)});`;
    } else {
      return `glRotatef(${t.params[0].toFixed(1)}, ${t.params[1]}, ${t.params[2]}, ${t.params[3]});`;
    }
  }).join('\n');
}
