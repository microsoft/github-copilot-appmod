/**
 * Shared constants for task scripts
 */

// Tasks directory name
const TASKS_DIR = 'tasks';

// Required frontmatter fields in task.md
const REQUIRED_FRONTMATTER_FIELDS = ['id', 'name', 'type'];

// Valid task types
const VALID_TASK_TYPES = ['task'];

// File extensions that should be included as references
const REFERENCE_EXTENSIONS = [
  '.java', '.xml', '.properties', '.json', '.yaml', '.yml',
  '.template', '.diff', '.txt', '.py', '.js', '.ts', '.md',
  '.groovy', '.kt', '.scala', '.gradle', '.sh', '.bat', '.ps1'
];

// Files to exclude from references
const EXCLUDED_FILES = ['task.md', 'README.md'];

// Forbidden patterns in task content (validation)
const FORBIDDEN_PATTERNS = [
  /\beval\s*\(/gi,
  /\bexec\s*\(/gi,
  /\bprocess\.env/gi,
  /\brequire\s*\(['"]\s*child_process/gi,
  /\bspawn\s*\(/gi,
  /\bshell\s*:/gi,
  /rm\s+-rf\s+\//gi,
  /\bsudo\b/gi,
  /\bcurl\s+.*\|\s*sh/gi,
  /\bwget\s+.*\|\s*sh/gi,
];

// Security patterns for validation warnings
const SECURITY_PATTERNS = [
  { pattern: /ignore\s+(all\s+)?(previous|above)\s+(instructions?|prompts?)/gi, description: 'Prompt injection attempt' },
  { pattern: /disregard\s+(all\s+)?(previous|above)/gi, description: 'Prompt injection attempt' },
  { pattern: /forget\s+(all\s+)?(previous|above)/gi, description: 'Prompt injection attempt' },
  { pattern: /you\s+are\s+now\s+(a|an)/gi, description: 'Role hijacking attempt' },
  { pattern: /act\s+as\s+(if|a|an)/gi, description: 'Potential role manipulation' },
  { pattern: /pretend\s+(you|to\s+be)/gi, description: 'Potential role manipulation' },
  { pattern: /\bformat\s+[a-z]:/gi, description: 'Potentially dangerous disk command' },
  { pattern: /\bdel\s+\/[fqs]/gi, description: 'Potentially dangerous delete command' },
  { pattern: /\brmdir\s+\/s/gi, description: 'Potentially dangerous directory removal' },
];

module.exports = {
  TASKS_DIR,
  REQUIRED_FRONTMATTER_FIELDS,
  VALID_TASK_TYPES,
  REFERENCE_EXTENSIONS,
  EXCLUDED_FILES,
  FORBIDDEN_PATTERNS,
  SECURITY_PATTERNS,
};

