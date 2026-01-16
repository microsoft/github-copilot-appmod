/**
 * Reference management utilities
 * Handles parsing, generating, and updating **References:** sections in task.md files
 */

const fs = require('fs');
const path = require('path');
const { getTaskFiles } = require('./task-utils');

/**
 * Parse existing references from task.md content
 * @param {string} content - The task.md file content
 * @returns {Object} - { fileRefs: string[], urlRefs: string[], hasReferencesSection: boolean }
 */
function parseReferences(content) {
  const referencesMatch = content.match(/\*\*References:\*\*\s*([\s\S]*?)(?=\n\n|\n##|\n\*\*|$)/);
  if (!referencesMatch) {
    return { fileRefs: [], urlRefs: [], hasReferencesSection: false };
  }

  const referencesBlock = referencesMatch[1];
  const lines = referencesBlock.split('\n').filter(line => line.trim().startsWith('-'));
  
  const fileRefs = [];
  const urlRefs = [];
  
  for (const line of lines) {
    const match = line.match(/-\s*(.+)/);
    if (match) {
      const ref = match[1].trim();
      if (ref.startsWith('file:///')) {
        fileRefs.push(ref.replace('file:///', ''));
      } else if (ref.startsWith('git+file:///')) {
        fileRefs.push(ref.replace('git+file:///', ''));
      } else if (ref.startsWith('http://') || ref.startsWith('https://')) {
        urlRefs.push(ref);
      }
    }
  }
  
  return { fileRefs, urlRefs, hasReferencesSection: true };
}

/**
 * Generate the **References:** section content
 * @param {string[]} files - Array of file names to include
 * @param {string[]} urlRefs - Array of URL references to include
 * @returns {string} - The formatted references section
 */
function generateReferencesSection(files, urlRefs) {
  const lines = ['**References:**'];
  
  // Add file references (sorted)
  for (const file of files.sort()) {
    if (file.endsWith('.diff')) {
      lines.push(`- git+file:///${file}`);
    } else {
      lines.push(`- file:///${file}`);
    }
  }
  
  // Add URL references
  for (const url of urlRefs) {
    lines.push(`- ${url}`);
  }
  
  return lines.join('\n');
}

/**
 * Check if file references match actual files in the folder
 * @param {string[]} fileRefs - Existing file references
 * @param {string[]} actualFiles - Actual files in the folder
 * @returns {boolean}
 */
function referencesMatch(fileRefs, actualFiles) {
  const sortedFileRefs = [...fileRefs].sort();
  const sortedActualFiles = [...actualFiles].sort();
  return JSON.stringify(sortedFileRefs) === JSON.stringify(sortedActualFiles);
}

/**
 * Update task.md with correct file references
 * @param {string} taskPath - Path to the task folder
 * @param {string} taskName - Name of the task (for logging)
 * @returns {Object} - Update result with details
 */
function updateTaskReferences(taskPath, taskName) {
  const taskMdPath = path.join(taskPath, 'task.md');
  let content = fs.readFileSync(taskMdPath, 'utf8');
  
  // Get actual files in folder
  const actualFiles = getTaskFiles(taskPath);
  
  // Parse existing references
  const { fileRefs, urlRefs, hasReferencesSection } = parseReferences(content);
  
  // Check if file references already match
  if (referencesMatch(fileRefs, actualFiles) && hasReferencesSection) {
    return { updated: false, files: actualFiles };
  }
  
  // Generate new references section
  const newReferencesSection = generateReferencesSection(actualFiles, urlRefs);
  
  if (hasReferencesSection) {
    // Replace existing references section
    content = content.replace(
      /\*\*References:\*\*\s*([\s\S]*?)(?=\n\n|\n##|\n\*\*|$)/,
      newReferencesSection
    );
  } else {
    // Add references section at the end
    content = content.trimEnd() + '\n\n' + newReferencesSection + '\n';
  }
  
  // Write updated content
  fs.writeFileSync(taskMdPath, content, 'utf8');
  
  return { 
    updated: true, 
    files: actualFiles,
    oldFileRefs: fileRefs,
    added: actualFiles.filter(f => !fileRefs.includes(f)),
    removed: fileRefs.filter(f => !actualFiles.includes(f)),
  };
}

/**
 * Log reference update result
 * @param {string} taskName - Name of the task
 * @param {Object} result - Result from updateTaskReferences
 */
function logReferenceUpdate(taskName, result) {
  if (!result.updated) return;
  
  console.log(`📝 Updated references in ${taskName}/task.md:`);
  if (result.added.length > 0) {
    console.log(`   + Added: ${result.added.join(', ')}`);
  }
  if (result.removed.length > 0) {
    console.log(`   - Removed: ${result.removed.join(', ')}`);
  }
  if (!result.oldFileRefs.length && result.files.length > 0) {
    console.log(`   + Files: ${result.files.join(', ')}`);
  }
}

module.exports = {
  parseReferences,
  generateReferencesSection,
  referencesMatch,
  updateTaskReferences,
  logReferenceUpdate,
};
