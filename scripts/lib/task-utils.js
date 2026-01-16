/**
 * Shared utilities for task operations
 */

const fs = require('fs');
const path = require('path');
const { TASKS_DIR, REFERENCE_EXTENSIONS, EXCLUDED_FILES } = require('./constants');

/**
 * Get the root directory of the project
 * @param {string} scriptDir - The directory of the calling script (use __dirname)
 */
function getRootDir(scriptDir) {
  // If called from scripts/lib/, go up two levels
  // If called from scripts/, go up one level
  if (scriptDir.endsWith('lib')) {
    return path.join(scriptDir, '..', '..');
  }
  return path.join(scriptDir, '..');
}

/**
 * Get the tasks directory path
 */
function getTasksDir(rootDir) {
  return path.join(rootDir, TASKS_DIR);
}

/**
 * Check if tasks directory exists
 */
function tasksDirectoryExists(rootDir) {
  return fs.existsSync(getTasksDir(rootDir));
}

/**
 * Get all task folder entries
 */
function getTaskFolders(rootDir) {
  const tasksDir = getTasksDir(rootDir);
  if (!fs.existsSync(tasksDir)) {
    return [];
  }
  
  return fs.readdirSync(tasksDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'));
}

/**
 * Get task.md path for a task folder
 */
function getTaskMdPath(rootDir, taskFolderName) {
  return path.join(getTasksDir(rootDir), taskFolderName, 'task.md');
}

/**
 * Check if a task folder has task.md
 */
function hasTaskMd(rootDir, taskFolderName) {
  return fs.existsSync(getTaskMdPath(rootDir, taskFolderName));
}

/**
 * Read and parse task.md file
 */
function readTaskMd(taskMdPath) {
  const content = fs.readFileSync(taskMdPath, 'utf8');
  const parsed = matter(content);
  return {
    content,
    data: parsed.data,
    body: parsed.content,
  };
}

/**
 * Get all reference-worthy files in a task folder
 */
function getTaskFiles(taskPath) {
  const files = fs.readdirSync(taskPath);
  return files.filter(file => {
    if (EXCLUDED_FILES.includes(file)) return false;
    // Include files with known extensions or template files
    return REFERENCE_EXTENSIONS.some(refExt => file.endsWith(refExt)) || file.includes('.template');
  }).sort();
}

/**
 * Validate folder name format (lowercase with hyphens)
 */
function isValidFolderName(folderName) {
  const validPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return validPattern.test(folderName);
}

module.exports = {
  getRootDir,
  getTasksDir,
  tasksDirectoryExists,
  getTaskFolders,
  getTaskMdPath,
  hasTaskMd,
  readTaskMd,
  getTaskFiles,
  isValidFolderName,
};
