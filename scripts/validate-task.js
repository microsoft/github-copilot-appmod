#!/usr/bin/env node
/**
 * Task Validation Script
 * 
 * Validates that task folders follow the required format specification:
 * - Valid YAML frontmatter with required fields
 * - **Prompt:** section present
 * - No forbidden patterns
 * - Proper folder naming conventions
 * 
 * Usage: 
 *   npm run validate              # Validate all tasks
 *   npm run validate [folder...]  # Validate specific folders
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const { 
  TASKS_DIR, 
  REQUIRED_FRONTMATTER_FIELDS, 
  VALID_TASK_TYPES,
  FORBIDDEN_PATTERNS,
  SECURITY_PATTERNS,
} = require('./lib/constants');

const {
  getRootDir,
  getTasksDir,
  getTaskMdPath,
  getTaskFolders,
  isValidFolderName,
} = require('./lib/task-utils');

/**
 * Task Validator Class
 */
class TaskValidator {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.tasksDir = getTasksDir(rootDir);
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a single task folder
   */
  validateTask(taskFolderName) {
    const taskMdPath = getTaskMdPath(this.rootDir, taskFolderName);

    // Check if task.md exists
    if (!fs.existsSync(taskMdPath)) {
      this.errors.push({
        task: taskFolderName,
        type: 'missing_file',
        message: 'Missing required file: task.md',
      });
      return false;
    }

    // Validate task.md content
    try {
      const content = fs.readFileSync(taskMdPath, 'utf8');
      return this.validateTaskMd(taskFolderName, content);
    } catch (error) {
      this.errors.push({
        task: taskFolderName,
        type: 'read_error',
        message: `Error reading task.md: ${error.message}`,
      });
      return false;
    }
  }

  /**
   * Validate task.md content
   */
  validateTaskMd(taskFolderName, content) {
    let isValid = true;

    // Parse frontmatter
    let data;
    try {
      const parsed = matter(content);
      data = parsed.data;
    } catch (error) {
      this.errors.push({
        task: taskFolderName,
        type: 'frontmatter_error',
        message: `Invalid YAML frontmatter: ${error.message}`,
      });
      return false;
    }

    // Check required frontmatter fields
    for (const field of REQUIRED_FRONTMATTER_FIELDS) {
      if (!data[field]) {
        this.errors.push({
          task: taskFolderName,
          type: 'missing_field',
          message: `Missing required frontmatter field: ${field}`,
        });
        isValid = false;
      }
    }

    // Validate id matches folder name
    if (data.id && data.id !== taskFolderName) {
      this.warnings.push({
        task: taskFolderName,
        type: 'id_mismatch',
        message: `Task id "${data.id}" does not match folder name "${taskFolderName}"`,
      });
    }

    // Validate task type
    if (data.type && !VALID_TASK_TYPES.includes(data.type)) {
      this.errors.push({
        task: taskFolderName,
        type: 'invalid_type',
        message: `Invalid task type: ${data.type}. Valid types: ${VALID_TASK_TYPES.join(', ')}`,
      });
      isValid = false;
    }

    // Check for required **Prompt:** section
    if (!content.includes('**Prompt:**')) {
      this.errors.push({
        task: taskFolderName,
        type: 'missing_prompt',
        message: 'Missing required **Prompt:** section',
      });
      isValid = false;
    }

    // Check for **References:** section (warning only)
    if (!content.includes('**References:**')) {
      this.warnings.push({
        task: taskFolderName,
        type: 'missing_references',
        message: 'Missing **References:** section (recommended)',
      });
    }

    // Check for forbidden patterns
    for (const pattern of FORBIDDEN_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      if (pattern.test(content)) {
        this.errors.push({
          task: taskFolderName,
          type: 'forbidden_pattern',
          message: `Content contains forbidden pattern: ${pattern.toString()}`,
        });
        isValid = false;
      }
    }

    // Check for security patterns (warnings)
    for (const { pattern, description } of SECURITY_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      if (pattern.test(content)) {
        this.warnings.push({
          task: taskFolderName,
          type: 'security_warning',
          message: `${description}: ${pattern.toString()}`,
        });
      }
    }

    return isValid;
  }

  /**
   * Validate folder name format
   */
  validateFolderName(folderName) {
    if (!isValidFolderName(folderName)) {
      this.warnings.push({
        task: folderName,
        type: 'naming_convention',
        message: 'Folder name should be lowercase with hyphens (e.g., "my-task-name")',
      });
    }
  }

  /**
   * Validate all tasks in the repository
   */
  validateAll() {
    if (!fs.existsSync(this.tasksDir)) {
      console.log('No tasks directory found.');
      return { valid: 0, invalid: 0, errors: [], warnings: [] };
    }

    const taskFolders = getTaskFolders(this.rootDir);
    let validTasks = 0;
    let invalidTasks = 0;

    for (const entry of taskFolders) {
      const taskMdPath = getTaskMdPath(this.rootDir, entry.name);
      if (fs.existsSync(taskMdPath)) {
        this.validateFolderName(entry.name);
        if (this.validateTask(entry.name)) {
          validTasks++;
        } else {
          invalidTasks++;
        }
      }
    }

    return {
      valid: validTasks,
      invalid: invalidTasks,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Validate only specific tasks (for PR validation)
   */
  validateChangedTasks(changedFolders) {
    let validTasks = 0;
    let invalidTasks = 0;

    for (const folder of changedFolders) {
      this.validateFolderName(folder);
      if (this.validateTask(folder)) {
        validTasks++;
      } else {
        invalidTasks++;
      }
    }

    return {
      valid: validTasks,
      invalid: invalidTasks,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Generate markdown report
   */
  generateReport(results) {
    let report = '# Task Validation Report\n\n';

    report += '## Summary\n';
    report += `- ✅ Valid tasks: ${results.valid}\n`;
    report += `- ❌ Invalid tasks: ${results.invalid}\n`;
    report += `- ⚠️ Warnings: ${results.warnings.length}\n`;

    if (results.errors.length > 0) {
      report += '\n## Errors\n\n';
      for (const error of results.errors) {
        report += `### ${error.task}\n`;
        report += `- **Type:** ${error.type}\n`;
        report += `- **Message:** ${error.message}\n\n`;
      }
    }

    if (results.warnings.length > 0) {
      report += '\n## Warnings\n\n';
      for (const warning of results.warnings) {
        report += `### ${warning.task}\n`;
        report += `- **Type:** ${warning.type}\n`;
        report += `- **Message:** ${warning.message}\n\n`;
      }
    }

    return report;
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const rootDir = args[0] || path.join(__dirname, '..');
  const changedFolders = args.slice(1);

  const validator = new TaskValidator(rootDir);
  
  let results;
  if (changedFolders.length > 0) {
    console.log(`Validating changed tasks: ${changedFolders.join(', ')}`);
    results = validator.validateChangedTasks(changedFolders);
  } else {
    console.log('Validating all tasks...');
    results = validator.validateAll();
  }

  const report = validator.generateReport(results);
  console.log(report);

  // Exit with error code if there are errors
  if (results.errors.length > 0) {
    process.exit(1);
  }
}

module.exports = { TaskValidator };
