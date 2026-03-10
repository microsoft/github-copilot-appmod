/**
 * Shared constants for skill scripts
 */

// Default skills directory name
const DEFAULT_SKILLS_DIR = 'skills';

// Required frontmatter fields in SKILL.md (per Agent Skills spec)
const REQUIRED_FRONTMATTER_FIELDS = ['name', 'description'];

// Optional frontmatter fields in SKILL.md
const OPTIONAL_FRONTMATTER_FIELDS = ['license', 'compatibility', 'metadata', 'allowed-tools'];

// Skill name constraints
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Description constraints
const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

// Compatibility field max length
const SKILL_COMPATIBILITY_MAX_LENGTH = 500;

// Forbidden patterns in skill content (validation)
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
  DEFAULT_SKILLS_DIR,
  REQUIRED_FRONTMATTER_FIELDS,
  OPTIONAL_FRONTMATTER_FIELDS,
  SKILL_NAME_MAX_LENGTH,
  SKILL_NAME_PATTERN,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_COMPATIBILITY_MAX_LENGTH,
  FORBIDDEN_PATTERNS,
  SECURITY_PATTERNS,
};

