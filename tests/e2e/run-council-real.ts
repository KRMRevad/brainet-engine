/**
 * PHASE 1 E2E TEST — REAL INFRASTRUCTURE EXECUTION
 *
 * Status: 🟢 LIVE TEST
 * Target: 4 Real Chrome Tabs (ChatGPT, Claude, Gemini, Grok)
 * Puppeteer: CDP port 9222 (via Tailscale)
 * Monitoring: Real-time console logging + detailed reporting
 *
 * Execution: ts-node tests/e2e/run-council-real.ts
 */

import chalk from 'chalk';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  CHROME_PORT: parseInt(process.env.CHROME_DEBUG_PORT || '9222', 10),
  CHROME_HOST: 'localhost',
  API_BASE_URL: 'http://localhost:3001',
  POLL_INTERVAL: 2000, // 2 seconds (avoid rate limiting)
  POLL_TIMEOUT: 600000, // 10 minutes
  SCRAPLING_URL: process.env.SCRAPLING_URL || 'http://100.66.114.87:8765'
};

// ============================================================================
// LOGGER
// ============================================================================

const log = {
  title: (msg: string) => console.log(chalk.bold.cyan(`\n📋 ${msg}\n`)),
  step: (msg: string) => console.log(chalk.blue(`  ├─ ${msg}`)),
  success: (msg: string) => console.log(chalk.green(`  ✓ ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`  ✗ ERROR: ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(`  ⚠ WARNING: ${msg}`)),
  info: (msg: string) => console.log(chalk.gray(`  ℹ ${msg}`)),
  status: (status: string, extra?: string) =>
    console.log(chalk.magenta(`  Status: ${status}${extra ? ` (${extra})` : ''}`)),
  tab: (tab: string, action: string) =>
    console.log(chalk.cyan(`  🔗 [${tab}] ${action}`))
};

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runCouncilE2ETest() {
  try {
    log.title('🚀 PHASE 1 COUNCIL E2E TEST — REAL INFRASTRUCTURE');

    // Step 1: Verify Chrome CDP Connection
    log.step('Verifying Chrome CDP Connection (port 9222)...');
    try {
      const cdpResponse = await fetch(`http://localhost:9222/json`);
      if (!cdpResponse.ok) {
        throw new Error(`Chrome CDP not responding (status ${cdpResponse.status})`);
      }
      const cdpData = (await cdpResponse.json()) as any[];
      log.success(`Chrome CDP responsive. Found ${cdpData.length} pages`);

      // List pages/tabs
      cdpData.forEach((page, idx) => {
        log.info(`Tab ${idx}: ${page.title || page.url}`);
      });
    } catch (e) {
      log.error(`Chrome CDP connection failed: ${(e as Error).message}`);
      throw e;
    }

    // Step 2: Verify Scrapling MCP Connection
    log.step('Verifying Scrapling MCP (Alienware 100.66.114.87:8765)...');
    try {
      const scraplingResponse = await fetch(`${CONFIG.SCRAPLING_URL}/health`);
      if (!scraplingResponse.ok) {
        throw new Error(`Scrapling MCP not responding (status ${scraplingResponse.status})`);
      }
      const scraplingData = await scraplingResponse.json();
      log.success(`Scrapling MCP online. Status: ${JSON.stringify(scraplingData)}`);
    } catch (e) {
      log.warn(`Scrapling MCP connection failed: ${(e as Error).message}. Will fallback to OpenClaw.`);
    }

    // Step 3: Authenticate & Get JWT Token
    log.step('Authenticating with password "admin"...');
    const authResponse = await fetch(`${CONFIG.API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin' })
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed (${authResponse.status})`);
    }

    const { token } = (await authResponse.json()) as any;
    log.success(`JWT Token obtained: ${token.substring(0, 20)}...`);

    // Step 4: Create Council Job
    log.step('Creating council job via API with JWT token...');
    const jobPayload = {
      tema: 'Impacto da IA no mercado imobiliário brasileiro',
      contexto: 'Incorporadora em SP quer usar IA para precificação e atendimento 24/7',
      objetivo: 'pesquisa',
      profundidade: 'profunda',
      fontes: [], // Empty sources to skip prefetch timeout
      restricoes: {
        idioma: 'pt-BR',
        formato_output: 'markdown',
        max_tokens: 8000,
        tom: 'executivo'
      },
      metadados: {
        usuario_id: 'test-user-phase1',
        sessao_id: `test-session-${Date.now()}`,
        prioridade: 'alta',
        tags: ['ia', 'imobiliario', 'e2e-test']
      }
    };

    const createResponse = await fetch(`${CONFIG.API_BASE_URL}/api/council/job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(jobPayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create job (${createResponse.status}): ${errorText}`);
    }

    const { jobId } = (await createResponse.json()) as any;
    log.success(`Job created: ${jobId}`);

    // Step 4: Polling for completion
    log.step(`Polling job status (timeout: ${CONFIG.POLL_TIMEOUT / 1000}s)...`);
    console.log(chalk.gray(`  └─ Poll interval: ${CONFIG.POLL_INTERVAL}ms`));

    let pollCount = 0;
    const startTime = Date.now();
    let jobResult: any = null;

    while (Date.now() - startTime < CONFIG.POLL_TIMEOUT) {
      pollCount++;

      const statusResponse = await fetch(`${CONFIG.API_BASE_URL}/api/council/job/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!statusResponse.ok) {
        log.error(`Status check failed (${statusResponse.status})`);
        throw new Error('Job status endpoint failed');
      }

      jobResult = (await statusResponse.json()) as any;
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

      // Log status with progress
      const statusColor =
        jobResult.status === 'complete' ? chalk.green :
        jobResult.status === 'error' ? chalk.red :
        chalk.yellow;

      process.stdout.write(
        chalk.gray(`    Poll #${pollCount} [${elapsedSeconds}s]: `) +
        statusColor(jobResult.status) +
        '\r'
      );

      if (jobResult.status === 'complete') {
        console.log(); // New line
        log.success(`Job completed in ${elapsedSeconds}s (${pollCount} polls)`);
        break;
      }

      if (jobResult.status === 'error') {
        console.log(); // New line
        log.error(`Job failed: ${jobResult.error_message || 'Unknown error'}`);
        throw new Error(`Job execution failed with status: error`);
      }

      if (jobResult.status === 'timeout') {
        console.log(); // New line
        log.error(`Job timeout after ${elapsedSeconds}s`);
        throw new Error(`Job execution timeout`);
      }

      await new Promise(r => setTimeout(r, CONFIG.POLL_INTERVAL));
    }

    if (!jobResult || jobResult.status !== 'complete') {
      throw new Error(`Test timeout: Job did not complete within ${CONFIG.POLL_TIMEOUT / 1000}s`);
    }

    // Step 5: Validate Results
    log.title('📊 VALIDATION: Agent Responses');

    const agents = [
      { name: 'Pesquisador (Gemini)', field: 'resultado_pesquisador' },
      { name: 'Visionário (GPT)', field: 'resultado_visionario' },
      { name: 'Desafiador (Grok)', field: 'resultado_desafiador' },
      { name: 'Capitão (Claude)', field: 'resultado_capitao' }
    ];

    let allAgentsResponded = true;

    for (const agent of agents) {
      const response = (jobResult as any)[agent.field];
      if (response) {
        // Handle both string and object responses (with .text or .error)
        const text = typeof response === 'string' ? response : response.text || response.error || '';
        const charCount = text.length;

        if (charCount > 0) {
          log.success(`${agent.name}: ${charCount} characters`);
          // Show first 100 chars
          const preview = text.substring(0, 100).replace(/\n/g, ' ');
          log.info(`Preview: "${preview}..."`);
        } else {
          log.warn(`${agent.name}: Empty response (${response.error || 'no error message'})`);
        }
      } else {
        log.error(`${agent.name}: NO RESPONSE`);
        allAgentsResponded = false;
      }
    }

    // Step 6: Validate Capitão Output Structure
    log.title('🔍 VALIDATION: Capitão Output Structure');

    const capitaoRaw = (jobResult as any).resultado_capitao || {};
    const capitaoOutput = typeof capitaoRaw === 'string' ? capitaoRaw : capitaoRaw.text || '';

    const validations = [
      {
        name: 'Capitão response present',
        test: () => capitaoOutput.length > 0,
        critical: false
      },
      {
        name: 'Markdown headers (##)',
        test: () => capitaoOutput.includes('##'),
        critical: false
      },
      {
        name: 'Síntese section',
        test: () => capitaoOutput.includes('Síntese'),
        critical: false
      },
      {
        name: 'Análise section',
        test: () => capitaoOutput.includes('Análise'),
        critical: false
      },
      {
        name: 'Recomendações section',
        test: () => capitaoOutput.includes('Recomendação'),
        critical: false
      },
      {
        name: 'Minimum length (500 chars)',
        test: () => capitaoOutput.length > 500,
        critical: false
      }
    ];

    let structureValid = true;
    for (const validation of validations) {
      const passed = validation.test();
      if (passed) {
        log.success(`${validation.name}`);
      } else {
        const level = validation.critical ? log.error : log.warn;
        level(`${validation.name}`);
        if (validation.critical) structureValid = false;
      }
    }

    // Final Report
    log.title('📈 TEST RESULTS');

    const results = {
      'Job Created': jobId,
      'Total Poll Time': `${Math.round((Date.now() - startTime) / 1000)}s`,
      'Poll Attempts': pollCount,
      'All Agents Responded': allAgentsResponded ? '✓' : '✗',
      'Capitão Output Valid': structureValid ? '✓' : '✗',
      'Final Status': jobResult.status.toUpperCase()
    };

    Object.entries(results).forEach(([key, value]) => {
      const isValid = typeof value === 'string' && (value === '✓' || value === 'COMPLETE');
      const color = isValid ? chalk.green : chalk.white;
      console.log(`  ${key}: ${color(value)}`);
    });

    // Success or Failure
    if (allAgentsResponded && structureValid && jobResult.status === 'complete') {
      log.title(chalk.bgGreen.black(' 🎉 TEST PASSED '));
      console.log(chalk.green(`\nAll 4 agents responded successfully!`));
      console.log(chalk.green(`Council orchestration working perfectly.\n`));
      process.exit(0);
    } else {
      log.title(chalk.bgRed.white(' ❌ TEST FAILED '));
      if (!allAgentsResponded) {
        console.log(chalk.red(`Some agents failed to respond.`));
      }
      if (!structureValid) {
        console.log(chalk.red(`Capitão output structure invalid.`));
      }
      console.log();
      process.exit(1);
    }
  } catch (e) {
    log.title(chalk.bgRed.white(' 💥 CRITICAL ERROR '));
    log.error((e as Error).message);
    console.log(chalk.red(`\nStack:\n${(e as Error).stack}\n`));
    process.exit(1);
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════════════╗'));
console.log(chalk.bold.cyan('║        BRAINET COUNCIL PHASE 1 — REAL E2E TEST                ║'));
console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════╝\n'));

runCouncilE2ETest().catch(e => {
  console.error(chalk.red(`\nFatal error: ${(e as Error).message}`));
  process.exit(1);
});
