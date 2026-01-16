#!/usr/bin/env node
/**
 * Generate Metadata Script
 * 
 * This script:
 * 1. Syncs file references in task.md files with actual files in folders
 * 2. Generates metadata.json from all valid tasks
 * 
 * Usage: npm start
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const { TASKS_DIR } = require('./lib/constants');
const { 
  getRootDir, 
  getTasksDir, 
  getTaskFolders, 
  getTaskMdPath, 
  hasTaskMd 
} = require('./lib/task-utils');
const { 
  updateTaskReferences, 
  logReferenceUpdate 
} = require('./lib/references');

/**
 * Process a single task folder
 */
function processTask(rootDir, taskFolderName) {
  const taskPath = path.join(getTasksDir(rootDir), taskFolderName);
  const taskMdPath = getTaskMdPath(rootDir, taskFolderName);

  // Update file references
  const refResult = updateTaskReferences(taskPath, taskFolderName);
  logReferenceUpdate(taskFolderName, refResult);

  // Read updated content and extract metadata
  const fileContent = fs.readFileSync(taskMdPath, 'utf8');
  const { data } = matter(fileContent);

  if (data.id && data.name) {
    // Check if folder name matches the task ID
    if (data.id !== taskFolderName) {
      return {
        id: data.id,
        name: data.name,
        path: `${TASKS_DIR}/${taskFolderName}`,
        folderMismatch: true,
        folderName: taskFolderName,
      };
    }
    return {
      id: data.id,
      name: data.name,
      path: `${TASKS_DIR}/${taskFolderName}`,
    };
  } else {
    console.warn(`⚠️  Warning: ${taskFolderName}/task.md is missing required frontmatter (id, name)`);
    return null;
  }
}

/**
 * Main function to generate metadata
 */
function generateMetadata() {
  const rootDir = getRootDir(__dirname);
  const tasksDir = getTasksDir(rootDir);

  // Check if tasks directory exists
  if (!fs.existsSync(tasksDir)) {
    console.log('No tasks directory found. Creating empty metadata.json');
    fs.writeFileSync(
      path.join(rootDir, 'metadata.json'), 
      JSON.stringify({ tasks: [] }, null, 2), 
      'utf8'
    );
    return;
  }

  console.log('Processing tasks...\n');

  // Process all task folders
  const tasks = [];
  const taskFolders = getTaskFolders(rootDir);

  for (const entry of taskFolders) {
    if (!hasTaskMd(rootDir, entry.name)) continue;

    try {
      const task = processTask(rootDir, entry.name);
      if (task) {
        tasks.push(task);
      }
    } catch (error) {
      console.error(`❌ Error processing ${entry.name}:`, error.message);
    }
  }

  // Check for folder name and ID mismatches
  const mismatchedTasks = tasks.filter(task => task.folderMismatch);
  if (mismatchedTasks.length > 0) {
    console.error('\n❌ Error: Task folder name does not match task ID:');
    mismatchedTasks.forEach(task => {
      console.error(`   - Folder "${task.folderName}" has task ID "${task.id}"`);
    });
    console.error('\nThe folder name must match the task ID in the frontmatter. Please rename the folder or update the ID.');
    process.exit(1);
  }

  // Check for duplicate task IDs
  const idCounts = {};
  for (const task of tasks) {
    idCounts[task.id] = (idCounts[task.id] || 0) + 1;
  }
  const duplicateIds = Object.entries(idCounts)
    .filter(([id, count]) => count > 1)
    .map(([id, count]) => `"${id}" (appears ${count} times)`);

  if (duplicateIds.length > 0) {
    console.error('\n❌ Error: Duplicate task IDs found:');
    duplicateIds.forEach(dup => console.error(`   - ${dup}`));
    console.error('\nEach task must have a unique ID. Please fix the duplicate IDs and try again.');
    process.exit(1);
  }

  // Sort tasks by id
  tasks.sort((a, b) => a.id.localeCompare(b.id));

  // Write metadata.json
  const metadata = { tasks };
  fs.writeFileSync(
    path.join(rootDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf8'
  );

  console.log(`\n✅ Generated metadata.json with ${tasks.length} tasks`);
  tasks.forEach(task => console.log(`   - ${task.id}: ${task.name}`));
}

// Run if called directly
if (require.main === module) {
  generateMetadata();
}

module.exports = { generateMetadata };
