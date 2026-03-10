/**
 * Shared utilities for skill operations
 */

const fs = require('fs');
const path = require('path');
const { DEFAULT_SKILLS_DIR, SKILL_NAME_PATTERN } = require('./constants');

/**
 * Get the root directory of the project
 * @param {string} scriptDir - The directory of the calling script (use __dirname)
 */
function getRootDir(scriptDir) {
  if (scriptDir.endsWith('lib')) {
    return path.join(scriptDir, '..', '..');
  }
  return path.join(scriptDir, '..');
}

/**
 * Get the skills directory path
 */
function getSkillsDir(rootDir, skillsDirName) {
  return path.join(rootDir, skillsDirName || DEFAULT_SKILLS_DIR);
}

/**
 * Get all skill folder entries
 */
function getSkillFolders(rootDir, skillsDirName) {
  const skillsDir = getSkillsDir(rootDir, skillsDirName);
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'));
}

/**
 * Get SKILL.md path for a skill folder
 */
function getSkillMdPath(rootDir, skillFolderName, skillsDirName) {
  return path.join(getSkillsDir(rootDir, skillsDirName), skillFolderName, 'SKILL.md');
}

/**
 * Check if a skill folder has SKILL.md
 */
function hasSkillMd(rootDir, skillFolderName, skillsDirName) {
  return fs.existsSync(getSkillMdPath(rootDir, skillFolderName, skillsDirName));
}

/**
 * Validate skill name format (lowercase alphanumeric with hyphens, per Agent Skills spec)
 */
function isValidSkillName(name) {
  return SKILL_NAME_PATTERN.test(name);
}

module.exports = {
  getRootDir,
  getSkillsDir,
  getSkillFolders,
  getSkillMdPath,
  hasSkillMd,
  isValidSkillName,
};
