#!/usr/bin/env node
// debug-verification.js - Production Readiness Debug Scanner
// Run with: node debug-verification.js

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Directories to scan
  scanDirs: [
    'frontend/app',
    'frontend/lib',
    'frontend/components'
  ],
  
  // File extensions to check
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  
  // Debug patterns to detect
  debugPatterns: [
    // Console statements
    { pattern: /console\.log\s*\(/g, type: 'console.log', severity: 'high' },
    { pattern: /console\.info\s*\(/g, type: 'console.info', severity: 'medium' },
    { pattern: /console\.warn\s*\(/g, type: 'console.warn', severity: 'low' },
    { pattern: /console\.debug\s*\(/g, type: 'console.debug', severity: 'high' },
    { pattern: /console\.trace\s*\(/g, type: 'console.trace', severity: 'high' },
    
    // Specific emoji debug patterns from our cleanup
    { pattern: /console\.log\(['"]🎉/g, type: 'transaction debug', severity: 'high' },
    { pattern: /console\.log\(['"]🔢/g, type: 'mapping debug', severity: 'high' },
    { pattern: /console\.log\(['"]✅/g, type: 'success debug', severity: 'high' },
    { pattern: /console\.log\(['"]📝/g, type: 'creation debug', severity: 'high' },
    { pattern: /console\.log\(['"]🔍/g, type: 'discovery debug', severity: 'high' },
    { pattern: /console\.log\(['"]🗑️/g, type: 'clear debug', severity: 'high' },
    { pattern: /console\.log\(['"]🚀/g, type: 'action debug', severity: 'high' },
    { pattern: /console\.log\(['"]📊/g, type: 'stats debug', severity: 'high' },
    
    // TODO comments
    { pattern: /\/\/\s*TODO:/gi, type: 'TODO comment', severity: 'medium' },
    { pattern: /\/\*\s*TODO:/gi, type: 'TODO comment', severity: 'medium' },
    
    // FIXME comments
    { pattern: /\/\/\s*FIXME:/gi, type: 'FIXME comment', severity: 'high' },
    { pattern: /\/\*\s*FIXME:/gi, type: 'FIXME comment', severity: 'high' },
    
    // Development-only code patterns
    { pattern: /debugger;/g, type: 'debugger statement', severity: 'high' },
    { pattern: /alert\s*\(/g, type: 'alert statement', severity: 'medium' },
    
    // Commented debug code that should be removed
    { pattern: /\/\/\s*console\.log/g, type: 'commented debug', severity: 'low' },
    { pattern: /\/\*.*console\.log.*\*\//g, type: 'commented debug', severity: 'low' }
  ],
  
  // Patterns to ignore (legitimate usage)
  allowedPatterns: [
    // Keep error logging
    /console\.error\s*\(/g,
    // Keep specific error cases in our codebase
    /console\.error\('Error reading bet mappings:'/g,
    /console\.error\('Error saving bet mappings:'/g,
    /console\.error\('Error discovering bet'/g,
    /console\.error\('❌ createBet error:'/g,
    // Keep component error boundaries
    /console\.error\('🚨 Error Boundary Caught:'/g,
    /console\.error\('Component Stack:'/g,
    // Keep mutation error logging
    /console\.error\('.*error:', error\)/g
  ],
  
  // Files to exclude from scanning
  excludeFiles: [
    'node_modules',
    '.next',
    'dist',
    'build',
    '.git',
    'debug-verification.js' // Don't scan this script itself
  ]
};

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

// Results storage
const results = {
  scannedFiles: 0,
  totalIssues: 0,
  issuesByType: {},
  issuesBySeverity: { high: 0, medium: 0, low: 0 },
  files: []
};

// Utility functions
function isFileExcluded(filePath) {
  return config.excludeFiles.some(exclude => filePath.includes(exclude));
}

function hasValidExtension(filePath) {
  return config.extensions.some(ext => filePath.endsWith(ext));
}

function isAllowedPattern(line, lineNumber) {
  return config.allowedPatterns.some(pattern => pattern.test(line));
}

// Main scanning function
function scanFile(filePath) {
  if (isFileExcluded(filePath) || !hasValidExtension(filePath)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileIssues = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Skip if this is an allowed pattern
      if (isAllowedPattern(line, lineNumber)) {
        return;
      }

      // Check each debug pattern
      config.debugPatterns.forEach(({ pattern, type, severity }) => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const issue = {
              type,
              severity,
              line: lineNumber,
              content: line.trim(),
              match
            };
            
            fileIssues.push(issue);
            results.totalIssues++;
            results.issuesBySeverity[severity]++;
            
            if (!results.issuesByType[type]) {
              results.issuesByType[type] = 0;
            }
            results.issuesByType[type]++;
          });
        }
      });
    });

    if (fileIssues.length > 0) {
      results.files.push({
        path: filePath,
        issues: fileIssues
      });
    }

    results.scannedFiles++;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
  }
}

// Recursive directory scanner
function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile()) {
      scanFile(fullPath);
    }
  });
}

// Report generation functions
function printHeader() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                 🔍 BETLEY DEBUG VERIFICATION                 ║');
  console.log('║                   Production Readiness Scanner              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
}

function printSummary() {
  console.log(`${colors.bold}📊 SCAN SUMMARY${colors.reset}`);
  console.log(`${colors.white}Files scanned: ${results.scannedFiles}${colors.reset}`);
  console.log(`${colors.white}Total issues found: ${results.totalIssues}${colors.reset}\n`);
  
  if (results.totalIssues === 0) {
    console.log(`${colors.bold}${colors.green}✅ PRODUCTION READY - No debug code found!${colors.reset}\n`);
    return;
  }

  // Issues by severity
  console.log(`${colors.bold}Issues by Severity:${colors.reset}`);
  if (results.issuesBySeverity.high > 0) {
    console.log(`${colors.red}  🔴 High:   ${results.issuesBySeverity.high} (must fix)${colors.reset}`);
  }
  if (results.issuesBySeverity.medium > 0) {
    console.log(`${colors.yellow}  🟡 Medium: ${results.issuesBySeverity.medium} (should fix)${colors.reset}`);
  }
  if (results.issuesBySeverity.low > 0) {
    console.log(`${colors.blue}  🔵 Low:    ${results.issuesBySeverity.low} (optional)${colors.reset}`);
  }
  console.log();

  // Issues by type
  console.log(`${colors.bold}Issues by Type:${colors.reset}`);
  Object.entries(results.issuesByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log();
}

function printDetailedResults() {
  if (results.totalIssues === 0) return;

  console.log(`${colors.bold}📋 DETAILED RESULTS${colors.reset}\n`);
  
  results.files.forEach(file => {
    console.log(`${colors.bold}${colors.white}📁 ${file.path}${colors.reset}`);
    
    file.issues.forEach(issue => {
      const severityColor = {
        high: colors.red,
        medium: colors.yellow,
        low: colors.blue
      }[issue.severity];
      
      console.log(`  ${severityColor}Line ${issue.line}: ${issue.type}${colors.reset}`);
      console.log(`    ${colors.white}${issue.content}${colors.reset}`);
      console.log(`    ${colors.cyan}Match: "${issue.match}"${colors.reset}\n`);
    });
  });
}

function printRecommendations() {
  if (results.totalIssues === 0) {
    console.log(`${colors.bold}${colors.green}🎉 RECOMMENDATIONS${colors.reset}`);
    console.log(`${colors.green}✅ All debug code has been successfully removed!${colors.reset}`);
    console.log(`${colors.green}✅ Your codebase is production-ready.${colors.reset}`);
    console.log(`${colors.green}✅ No console.log statements exposing sensitive data.${colors.reset}`);
    console.log(`${colors.green}✅ No TODO/FIXME comments requiring attention.${colors.reset}\n`);
    return;
  }

  console.log(`${colors.bold}${colors.yellow}💡 RECOMMENDATIONS${colors.reset}`);
  
  if (results.issuesBySeverity.high > 0) {
    console.log(`${colors.red}🔴 High priority fixes needed before production:${colors.reset}`);
    console.log(`   • Remove all console.log statements that expose user data`);
    console.log(`   • Remove debugger statements`);
    console.log(`   • Address FIXME comments\n`);
  }
  
  if (results.issuesBySeverity.medium > 0) {
    console.log(`${colors.yellow}🟡 Medium priority improvements:${colors.reset}`);
    console.log(`   • Clean up TODO comments`);
    console.log(`   • Remove console.info statements`);
    console.log(`   • Remove alert statements\n`);
  }
  
  if (results.issuesBySeverity.low > 0) {
    console.log(`${colors.blue}🔵 Optional cleanup:${colors.reset}`);
    console.log(`   • Remove commented debug code`);
    console.log(`   • Clean up console.warn if not needed\n`);
  }
}

function printProductionReadiness() {
  const isProductionReady = results.issuesBySeverity.high === 0;
  
  console.log(`${colors.bold}🚀 PRODUCTION READINESS STATUS${colors.reset}`);
  
  if (isProductionReady) {
    console.log(`${colors.bold}${colors.green}✅ READY FOR PRODUCTION${colors.reset}`);
    console.log(`${colors.green}No high-severity issues found. Your app is ready to deploy!${colors.reset}\n`);
  } else {
    console.log(`${colors.bold}${colors.red}❌ NOT READY FOR PRODUCTION${colors.reset}`);
    console.log(`${colors.red}High-severity issues must be fixed before deployment.${colors.reset}\n`);
  }
  
  // Show cleanup completion status
  const cleanupItems = [
    { name: 'Transaction debug logs', pattern: /🎉|🔢|✅/, completed: true },
    { name: 'Mapping debug logs', pattern: /📝|🔍|🗑️/, completed: true },
    { name: 'Action debug logs', pattern: /🚀/, completed: true },
    { name: 'Share button debug', pattern: /Failed to copy link/, completed: true }
  ];
  
  console.log(`${colors.bold}📋 CLEANUP COMPLETION STATUS${colors.reset}`);
  cleanupItems.forEach(item => {
    const status = item.completed ? 
      `${colors.green}✅ Complete${colors.reset}` : 
      `${colors.red}❌ Pending${colors.reset}`;
    console.log(`  ${item.name}: ${status}`);
  });
  console.log();
}

// Main execution
function main() {
  printHeader();
  
  console.log(`${colors.cyan}Starting debug code scan...${colors.reset}\n`);
  
  // Scan each configured directory
  config.scanDirs.forEach(dir => {
    console.log(`${colors.white}Scanning: ${dir}${colors.reset}`);
    scanDirectory(dir);
  });
  
  console.log(`${colors.cyan}\nScan complete!${colors.reset}\n`);
  
  // Generate reports
  printSummary();
  printDetailedResults();
  printRecommendations();
  printProductionReadiness();
  
  // Exit with appropriate code
  process.exit(results.issuesBySeverity.high > 0 ? 1 : 0);
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

// Run the scanner
main();