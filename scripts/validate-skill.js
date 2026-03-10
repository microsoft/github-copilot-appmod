#!/usr/bin/env node
/**
 * Skill Validation Script
 *
 * Validates that skill folders follow the Agent Skills specification:
 * - Valid YAML frontmatter with required fields (name, description)
 * - Skill name matches folder name
 * - Name/description length constraints
 * - No forbidden patterns
 * - Proper folder naming conventions
 *
 * Usage:
 *   npm run validate                        # Validate all skills in default 'skills/' folder
 *   npm run validate -- --dir <folder>      # Validate skills in a custom folder
 *   npm run validate -- <skill1> <skill2>   # Validate specific skills
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const {
  DEFAULT_SKILLS_DIR,
  REQUIRED_FRONTMATTER_FIELDS,
  SKILL_NAME_MAX_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_COMPATIBILITY_MAX_LENGTH,
  FORBIDDEN_PATTERNS,
  SECURITY_PATTERNS,
} = require('./lib/constants');

const {
  getRootDir,
  getSkillsDir,
  getSkillMdPath,
  getSkillFolders,
  isValidSkillName,
} = require('./lib/skill-utils');

/**
 * Skill Validator Class
 */
class SkillValidator {
  constructor(rootDir, skillsDirName) {
    this.rootDir = rootDir;
    this.skillsDirName = skillsDirName || DEFAULT_SKILLS_DIR;
    this.skillsDir = getSkillsDir(rootDir, this.skillsDirName);
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a single skill folder
   */
  validateSkill(skillFolderName) {
    const skillMdPath = getSkillMdPath(this.rootDir, skillFolderName, this.skillsDirName);

    if (!fs.existsSync(skillMdPath)) {
      this.errors.push({
        skill: skillFolderName,
        type: 'missing_file',
        message: 'Missing required file: SKILL.md',
      });
      return false;
    }

    try {
      const content = fs.readFileSync(skillMdPath, 'utf8');
      return this.validateSkillMd(skillFolderName, content);
    } catch (error) {
      this.errors.push({
        skill: skillFolderName,
        type: 'read_error',
        message: `Error reading SKILL.md: ${error.message}`,
      });
      return false;
    }
  }

  /**
   * Validate SKILL.md content per Agent Skills spec
   */
  validateSkillMd(skillFolderName, content) {
    let isValid = true;

    // Parse frontmatter
    let data;
    try {
      const parsed = matter(content);
      data = parsed.data;
    } catch (error) {
      this.errors.push({
        skill: skillFolderName,
        type: 'frontmatter_error',
        message: `Invalid YAML frontmatter: ${error.message}`,
      });
      return false;
    }

    // Check required frontmatter fields
    for (const field of REQUIRED_FRONTMATTER_FIELDS) {
      if (!data[field]) {
        this.errors.push({
          skill: skillFolderName,
          type: 'missing_field',
          message: `Missing required frontmatter field: ${field}`,
        });
        isValid = false;
      }
    }

    // Validate name format (lowercase alphanumeric with hyphens)
    if (data.name) {
      if (!isValidSkillName(data.name)) {
        this.errors.push({
          skill: skillFolderName,
          type: 'invalid_name',
          message: `Skill name "${data.name}" must be lowercase alphanumeric with hyphens, must not start/end with hyphen or contain consecutive hyphens`,
        });
        isValid = false;
      }

      if (data.name.length > SKILL_NAME_MAX_LENGTH) {
        this.errors.push({
          skill: skillFolderName,
          type: 'name_too_long',
          message: `Skill name exceeds ${SKILL_NAME_MAX_LENGTH} characters (got ${data.name.length})`,
        });
        isValid = false;
      }

      // Name must match folder name
      if (data.name !== skillFolderName) {
        this.errors.push({
          skill: skillFolderName,
          type: 'name_mismatch',
          message: `Skill name "${data.name}" does not match folder name "${skillFolderName}"`,
        });
        isValid = false;
      }
    }

    // Validate description length
    if (data.description && data.description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
      this.errors.push({
        skill: skillFolderName,
        type: 'description_too_long',
        message: `Description exceeds ${SKILL_DESCRIPTION_MAX_LENGTH} characters (got ${data.description.length})`,
      });
      isValid = false;
    }

    // Validate compatibility length (optional field)
    if (data.compatibility && data.compatibility.length > SKILL_COMPATIBILITY_MAX_LENGTH) {
      this.errors.push({
        skill: skillFolderName,
        type: 'compatibility_too_long',
        message: `Compatibility exceeds ${SKILL_COMPATIBILITY_MAX_LENGTH} characters (got ${data.compatibility.length})`,
      });
      isValid = false;
    }

    // Check for forbidden patterns
    for (const pattern of FORBIDDEN_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        this.errors.push({
          skill: skillFolderName,
          type: 'forbidden_pattern',
          message: `Content contains forbidden pattern: ${pattern.toString()}`,
        });
        isValid = false;
      }
    }

    // Check for security patterns (warnings)
    for (const { pattern, description } of SECURITY_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        this.warnings.push({
          skill: skillFolderName,
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
    if (!isValidSkillName(folderName)) {
      this.warnings.push({
        skill: folderName,
        type: 'naming_convention',
        message: 'Folder name should be lowercase alphanumeric with hyphens (e.g., "my-skill-name")',
      });
    }
  }

  /**
   * Validate all skills in the directory
   */
  validateAll() {
    if (!fs.existsSync(this.skillsDir)) {
      console.log(`No skills directory found at "${this.skillsDirName}/".`);
      return { valid: 0, invalid: 0, errors: [], warnings: [] };
    }

    const skillFolders = getSkillFolders(this.rootDir, this.skillsDirName);
    let validSkills = 0;
    let invalidSkills = 0;

    for (const entry of skillFolders) {
      const skillMdPath = getSkillMdPath(this.rootDir, entry.name, this.skillsDirName);
      if (fs.existsSync(skillMdPath)) {
        this.validateFolderName(entry.name);
        if (this.validateSkill(entry.name)) {
          validSkills++;
        } else {
          invalidSkills++;
        }
      }
    }

    return {
      valid: validSkills,
      invalid: invalidSkills,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Validate only specific skills
   */
  validateSpecificSkills(skillNames) {
    let validSkills = 0;
    let invalidSkills = 0;

    for (const name of skillNames) {
      this.validateFolderName(name);
      if (this.validateSkill(name)) {
        validSkills++;
      } else {
        invalidSkills++;
      }
    }

    return {
      valid: validSkills,
      invalid: invalidSkills,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Generate markdown report
   */
  generateReport(results) {
    let report = '# Skill Validation Report\n\n';

    report += '## Summary\n';
    report += `- ✅ Valid skills: ${results.valid}\n`;
    report += `- ❌ Invalid skills: ${results.invalid}\n`;
    report += `- ⚠️ Warnings: ${results.warnings.length}\n`;

    if (results.errors.length > 0) {
      report += '\n## Errors\n\n';
      for (const error of results.errors) {
        report += `### ${error.skill}\n`;
        report += `- **Type:** ${error.type}\n`;
        report += `- **Message:** ${error.message}\n\n`;
      }
    }

    if (results.warnings.length > 0) {
      report += '\n## Warnings\n\n';
      for (const warning of results.warnings) {
        report += `### ${warning.skill}\n`;
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

  let rootDir = path.join(__dirname, '..');
  let skillsDirName = DEFAULT_SKILLS_DIR;
  const specificSkills = [];

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      skillsDirName = args[++i];
    } else {
      specificSkills.push(args[i]);
    }
  }

  const validator = new SkillValidator(rootDir, skillsDirName);

  let results;
  if (specificSkills.length > 0) {
    console.log(`Validating skills: ${specificSkills.join(', ')}`);
    results = validator.validateSpecificSkills(specificSkills);
  } else {
    console.log(`Validating all skills in "${skillsDirName}/"...`);
    results = validator.validateAll();
  }

  const report = validator.generateReport(results);
  console.log(report);

  if (results.errors.length > 0) {
    process.exit(1);
  }
}

module.exports = { SkillValidator };
