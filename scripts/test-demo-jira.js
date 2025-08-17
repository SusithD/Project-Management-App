#!/usr/bin/env node

/**
 * Demo JIRA Integration Test Script
 *
 * This script tests the demo JIRA integration functionality to ensure
 * all mock data and URLs are working correctly for demo users.
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  demoBaseUrl: 'https://demo-company.atlassian.net',
  demoUserEmail: 'test.user@demo.com',
  expectedJiraProjects: ['RETAILSL', 'BANKSL', 'APISL', 'PORTALSL', 'ANALYTICSSL', 'ONBOARDINGSL'],
  testEndpoints: [
    '/api/jira/projects',
    '/api/jira/issues',
    '/api/demo/status'
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSubSection(title) {
  log(`\n${'-'.repeat(40)}`, 'yellow');
  log(`  ${title}`, 'yellow');
  log(`${'-'.repeat(40)}`, 'yellow');
}

function checkFileExists(filePath, description) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    log(`  Missing file: ${fullPath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchPatterns, description) {
  const fullPath = path.resolve(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    log(`✗ ${description} - File not found`, 'red');
    return false;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    let allFound = true;

    for (const pattern of searchPatterns) {
      if (typeof pattern === 'string') {
        if (!content.includes(pattern)) {
          log(`✗ ${description} - Missing: "${pattern}"`, 'red');
          allFound = false;
        }
      } else if (pattern instanceof RegExp) {
        if (!pattern.test(content)) {
          log(`✗ ${description} - Missing pattern: ${pattern}`, 'red');
          allFound = false;
        }
      }
    }

    if (allFound) {
      log(`✓ ${description}`, 'green');
      return true;
    }
  } catch (error) {
    log(`✗ ${description} - Error reading file: ${error.message}`, 'red');
  }

  return false;
}

function testDemoDataStructure() {
  logSubSection('Demo Data Structure');

  const checks = [
    {
      file: 'server/utils/demo-data.ts',
      patterns: [
        'DEMO_JIRA_CONFIG',
        'DEMO_JIRA_PROJECTS',
        'DEMO_JIRA_ISSUES',
        'getDemoJiraProjectUrl',
        'getDemoJiraIssueUrl',
        'https://demo-company.atlassian.net'
      ],
      description: 'Demo JIRA data and configuration'
    }
  ];

  return checks.every(check =>
    checkFileContent(check.file, check.patterns, check.description)
  );
}

function testDemoModeUtilities() {
  logSubSection('Demo Mode Utilities');

  const checks = [
    {
      file: 'server/utils/demo-mode.ts',
      patterns: [
        'getDemoJiraBaseUrl',
        'getDemoJiraProjectUrl',
        'getDemoJiraIssueUrl',
        'getJiraBaseUrl',
        'https://demo-company.atlassian.net'
      ],
      description: 'Demo mode JIRA utilities'
    }
  ];

  return checks.every(check =>
    checkFileContent(check.file, check.patterns, check.description)
  );
}

function testNuxtConfiguration() {
  logSubSection('Nuxt Configuration');

  const checks = [
    {
      file: 'nuxt.config.ts',
      patterns: [
        'DEMO_MODE',
        'demo-company.atlassian.net',
        /public:\s*{[\s\S]*jira:\s*{/
      ],
      description: 'Runtime config with demo JIRA URLs'
    }
  ];

  return checks.every(check =>
    checkFileContent(check.file, check.patterns, check.description)
  );
}

function testApiEndpoints() {
  logSubSection('API Endpoints');

  const checks = [
    {
      file: 'server/api/jira/projects.get.ts',
      patterns: [
        'isDemoMode',
        'isDemoUserEmail',
        'DEMO_JIRA_PROJECTS',
        'demoMode: true'
      ],
      description: 'JIRA projects API with demo support'
    },
    {
      file: 'server/api/jira/issues.get.ts',
      patterns: [
        'isDemoMode',
        'isDemoUserEmail',
        'DEMO_JIRA_ISSUES',
        'demoMode && isDemoUser'
      ],
      description: 'JIRA issues API with demo support'
    },
    {
      file: 'server/api/jira/bidirectional-sync.post.ts',
      patterns: [
        'isDemoMode',
        'isDemoUserEmail',
        'Demo mode: Simulating',
        'demoMode: true'
      ],
      description: 'JIRA sync API with demo support'
    },
    {
      file: 'server/api/jira/link-project.post.ts',
      patterns: [
        'isDemoMode',
        'isDemoUserEmail',
        'DEMO_JIRA_PROJECTS',
        'getDemoJiraProjectUrl'
      ],
      description: 'JIRA link project API with demo support'
    }
  ];

  return checks.every(check =>
    checkFileContent(check.file, check.patterns, check.description)
  );
}

function testFrontendComponents() {
  logSubSection('Frontend Components');

  const checks = [
    {
      file: 'components/jira/ProjectLinker.vue',
      patterns: [
        '@demo.com',
        'demo-company.atlassian.net',
        'isDemoUser'
      ],
      description: 'JIRA Project Linker with demo URLs'
    },
    {
      file: 'components/jira/IssuesDashboard.vue',
      patterns: [
        '@demo.com',
        'demo-company.atlassian.net',
        'isDemoUser'
      ],
      description: 'JIRA Issues Dashboard with demo URLs'
    },
    {
      file: 'pages/projects/[id].vue',
      patterns: [
        '@demo.com',
        'demo-company.atlassian.net',
        'isDemoUser'
      ],
      description: 'Project detail page with demo JIRA URLs'
    }
  ];

  return checks.every(check =>
    checkFileContent(check.file, check.patterns, check.description)
  );
}

function testRequiredFiles() {
  logSubSection('Required Files');

  const files = [
    'server/utils/demo-data.ts',
    'server/utils/demo-mode.ts',
    'server/api/jira/projects.get.ts',
    'server/api/jira/issues.get.ts',
    'server/api/jira/bidirectional-sync.post.ts',
    'server/api/jira/link-project.post.ts',
    'components/jira/ProjectLinker.vue',
    'components/jira/IssuesDashboard.vue',
    'pages/projects/[id].vue',
    'nuxt.config.ts'
  ];

  return files.every(file => checkFileExists(file, `File exists: ${file}`));
}

function validateDemoJiraProjects() {
  logSubSection('Demo JIRA Projects Validation');

  try {
    const demoDataPath = path.resolve(__dirname, '..', 'server/utils/demo-data.ts');
    const content = fs.readFileSync(demoDataPath, 'utf8');

    // Extract DEMO_JIRA_PROJECTS array
    const projectsMatch = content.match(/export const DEMO_JIRA_PROJECTS = \[([\s\S]*?)\];/);
    if (!projectsMatch) {
      log('✗ Could not find DEMO_JIRA_PROJECTS array', 'red');
      return false;
    }

    let allValid = true;

    // Check for expected project keys
    TEST_CONFIG.expectedJiraProjects.forEach(projectKey => {
      if (content.includes(`key: "${projectKey}"`)) {
        log(`✓ Found JIRA project: ${projectKey}`, 'green');
      } else {
        log(`✗ Missing JIRA project: ${projectKey}`, 'red');
        allValid = false;
      }
    });

    // Check for demo base URL
    if (content.includes(TEST_CONFIG.demoBaseUrl)) {
      log(`✓ Demo base URL configured: ${TEST_CONFIG.demoBaseUrl}`, 'green');
    } else {
      log(`✗ Demo base URL not found: ${TEST_CONFIG.demoBaseUrl}`, 'red');
      allValid = false;
    }

    return allValid;
  } catch (error) {
    log(`✗ Error validating demo JIRA projects: ${error.message}`, 'red');
    return false;
  }
}

function generateTestReport(results) {
  logSection('Test Report Summary');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;
  const failedTests = totalTests - passedTests;

  log(`Total Tests: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
  log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`,
      passedTests === totalTests ? 'green' : 'yellow');

  if (failedTests === 0) {
    log('\n🎉 All tests passed! Demo JIRA integration is ready.', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Set DEMO_MODE=true in your environment', 'blue');
    log('2. Start the application: npm run dev', 'blue');
    log('3. Navigate to /demo-login to test demo users', 'blue');
    log('4. Test JIRA integration features with demo users', 'blue');
  } else {
    log('\n❌ Some tests failed. Please fix the issues above.', 'red');
    log('\nFailed test categories:', 'yellow');
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        log(`- ${test}`, 'red');
      }
    });
  }
}

function runTests() {
  log('Demo JIRA Integration Test Suite', 'bright');
  log('Testing demo JIRA functionality and mock data...', 'cyan');

  const results = {
    'Required Files': testRequiredFiles(),
    'Demo Data Structure': testDemoDataStructure(),
    'Demo Mode Utilities': testDemoModeUtilities(),
    'Nuxt Configuration': testNuxtConfiguration(),
    'API Endpoints': testApiEndpoints(),
    'Frontend Components': testFrontendComponents(),
    'JIRA Projects Validation': validateDemoJiraProjects()
  };

  generateTestReport(results);

  // Exit with appropriate code
  const allPassed = Object.values(results).every(result => result);
  process.exit(allPassed ? 0 : 1);
}

// Additional utility functions for manual testing
function printDemoUrls() {
  logSection('Demo JIRA URLs Reference');

  log('Base URL:', 'cyan');
  log(`  ${TEST_CONFIG.demoBaseUrl}`, 'blue');

  log('\nProject URLs:', 'cyan');
  TEST_CONFIG.expectedJiraProjects.forEach(projectKey => {
    log(`  ${projectKey}: ${TEST_CONFIG.demoBaseUrl}/projects/${projectKey}`, 'blue');
  });

  log('\nSample Issue URLs:', 'cyan');
  log(`  RETAILSL-101: ${TEST_CONFIG.demoBaseUrl}/browse/RETAILSL-101`, 'blue');
  log(`  BANKSL-101: ${TEST_CONFIG.demoBaseUrl}/browse/BANKSL-101`, 'blue');
  log(`  APISL-101: ${TEST_CONFIG.demoBaseUrl}/browse/APISL-101`, 'blue');
}

function printTestCommands() {
  logSection('Manual Testing Commands');

  log('1. Start the application in demo mode:', 'cyan');
  log('   DEMO_MODE=true npm run dev', 'blue');

  log('\n2. Test demo login:', 'cyan');
  log('   Open: http://localhost:3000/demo-login', 'blue');
  log('   Select any user ending with @demo.com', 'blue');

  log('\n3. Test JIRA integration:', 'cyan');
  log('   - Navigate to any project', 'blue');
  log('   - Check the Overview tab for JIRA Project Linker', 'blue');
  log('   - Try linking to a demo JIRA project', 'blue');
  log('   - Verify URLs point to demo-company.atlassian.net', 'blue');

  log('\n4. Test API endpoints:', 'cyan');
  log('   curl -X GET "http://localhost:3000/api/jira/projects?userEmail=test@demo.com"', 'blue');
  log('   curl -X GET "http://localhost:3000/api/demo/status"', 'blue');
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'urls':
      printDemoUrls();
      break;
    case 'commands':
      printTestCommands();
      break;
    case 'help':
      log('Demo JIRA Integration Test Script', 'bright');
      log('\nUsage:', 'cyan');
      log('  node test-demo-jira.js [command]', 'blue');
      log('\nCommands:', 'cyan');
      log('  (no command) - Run all tests', 'blue');
      log('  urls         - Show demo JIRA URLs', 'blue');
      log('  commands     - Show manual testing commands', 'blue');
      log('  help         - Show this help message', 'blue');
      break;
    default:
      runTests();
  }
}

module.exports = {
  runTests,
  printDemoUrls,
  printTestCommands,
  TEST_CONFIG
};
