#!/usr/bin/env node

/**
 * Script to find and clean up files with problematic characters
 * Replaces shell commands that are not available in this environment
 */

import { readdir, unlink, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function findFilesRecursively(dir, pattern) {
  const results = [];
  
  try {
    const items = await readdir(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // Skip node_modules and .git directories
          if (item !== 'node_modules' && item !== '.git' && item !== '.bolt') {
            const subResults = await findFilesRecursively(fullPath, pattern);
            results.push(...subResults);
          }
        } else if (stats.isFile()) {
          // Check if filename matches problematic patterns
          if (pattern.test(item)) {
            results.push({
              path: fullPath,
              name: item,
              directory: dir
            });
          }
        }
      } catch (error) {
        // Skip files we can't access
        console.warn(`Could not access: ${fullPath}`);
      }
    }
  } catch (error) {
    console.warn(`Could not read directory: ${dir}`);
  }
  
  return results;
}

async function listProblematicFiles() {
  console.log('🔍 Searching for files with problematic characters...\n');
  
  // Pattern to match files with spaces, Polish characters, or other special chars
  const problematicPattern = /[\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|[^\w\-\.]/;
  
  const problematicFiles = await findFilesRecursively(projectRoot, problematicPattern);
  
  if (problematicFiles.length === 0) {
    console.log('✅ No files with problematic characters found!');
    return [];
  }
  
  console.log(`📁 Found ${problematicFiles.length} files with problematic characters:`);
  console.log('=' .repeat(60));
  
  problematicFiles.slice(0, 10).forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   📍 ${file.path}`);
    console.log('');
  });
  
  if (problematicFiles.length > 10) {
    console.log(`... and ${problematicFiles.length - 10} more files`);
  }
  
  return problematicFiles;
}

async function cleanupFiles(filesToDelete) {
  if (filesToDelete.length === 0) {
    console.log('ℹ️  No files to delete.');
    return;
  }
  
  console.log(`🗑️  Deleting ${filesToDelete.length} problematic files...\n`);
  
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const file of filesToDelete) {
    try {
      await unlink(file.path);
      console.log(`✅ Deleted: ${file.name}`);
      deletedCount++;
    } catch (error) {
      console.log(`❌ Failed to delete: ${file.name} (${error.message})`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Deleted: ${deletedCount} files`);
  console.log(`   Errors: ${errorCount} files`);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');
  
  try {
    const problematicFiles = await listProblematicFiles();
    
    if (shouldDelete && problematicFiles.length > 0) {
      await cleanupFiles(problematicFiles);
    } else if (problematicFiles.length > 0) {
      console.log('\n💡 To delete these files, run:');
      console.log('   npm run cleanup-files -- --delete');
    }
    
  } catch (error) {
    console.error('❌ Error during file cleanup:', error.message);
    process.exit(1);
  }
}

// Run the script
main();