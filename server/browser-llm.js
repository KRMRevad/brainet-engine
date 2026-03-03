/**
 * BRAINET Browser LLM Driver
 * Controls ChatGPT, Claude, and Gemini via Puppeteer CDP
 * Connects to the user's existing Chrome session with active logins
 */

import puppeteer from 'puppeteer-core'
import { getAdaptiveSelector } from './scrapling-bridge.js'
import fs from 'fs/promises'
import path from 'path'

let browser = null
let pages = {}
const DEBUG_SCREENSHOTS_DIR = process.env.DEBUG_SCREENSHOTS_DIR || '/tmp/brainet-debug-screenshots'

// Ensure debug directory exists (IIFE)
;(async () => {
    try {
        await fs.mkdir(DEBUG_SCREENSHOTS_DIR, { recursive: true })
    } catch (e) {
        // Directory may already exist
    }
})()

// ════════════════════════════════════════════════════════════════
// HEALTH CHECK & DEBUGGING FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Take screenshot of page for debugging
 * @param {Page} page - Puppeteer page
 * @param {string} agent - Agent name (for filename)
 * @param {string} stage - Stage name (e.g., "before-click", "after-send", "error")
 * @returns {string} Path to saved screenshot
 */
async function takeDebugScreenshot(page, agent, stage) {
    try {
        const timestamp = Date.now()
        const filename = `${agent}-${stage}-${timestamp}.png`
        const filepath = path.join(DEBUG_SCREENSHOTS_DIR, filename)

        await page.screenshot({ path: filepath, fullPage: false })
        console.log(`[BrowserLLM] 📸 Screenshot saved: ${filepath}`)
        return filepath
    } catch (e) {
        console.warn(`[BrowserLLM] Failed to take screenshot: ${e.message}`)
        return null
    }
}

/**
 * Health check: Verify page loaded correctly and isn't showing error
 * @param {Page} page - Puppeteer page
 * @param {string} ai - AI name (chatgpt, gemini, claude, grok)
 * @returns {object} { healthy: boolean, reason: string, screenshot?: string }
 */
async function healthCheckPage(page, ai) {
    try {
        console.log(`[BrowserLLM] 🏥 Health check for ${ai}...`)

        // Check for common error pages
        const errorIndicators = await page.evaluate(() => {
            const indicators = {
                '404': !!document.body.innerText?.includes('404'),
                '500': !!document.body.innerText?.includes('500'),
                'error_page': !!document.querySelector('[data-testid="error-page"], .error-page, .error-container'),
                'loading_spinner': !!document.querySelector('[data-testid="loading"], .spinner, .loading, .lds-ring'),
                'maintenance': !!document.body.innerText?.toLowerCase().includes('maintenance'),
                'offline': !!document.body.innerText?.toLowerCase().includes('offline'),
            }
            return indicators
        })

        // Check page title
        const title = await page.title()
        console.log(`[BrowserLLM] Page title: "${title}"`)

        // Evaluate health
        const hasErrors = Object.values(errorIndicators).some(v => v)
        if (hasErrors) {
            const screenshot = await takeDebugScreenshot(page, ai, 'health-check-failed')
            const reason = Object.entries(errorIndicators)
                .filter(([_, v]) => v)
                .map(([k]) => k)
                .join(', ')
            console.warn(`[BrowserLLM] ⚠️ Page unhealthy for ${ai}: ${reason}`)
            return { healthy: false, reason, screenshot }
        }

        // Check if any interactive element is visible
        const hasInteractiveElements = await page.evaluate(() => {
            const inputs = document.querySelectorAll('textarea, [contenteditable="true"], input[type="text"]')
            const buttons = document.querySelectorAll('button[type="submit"], button[aria-label*="Send"], button[aria-label*="send"]')

            return {
                inputs: inputs.length > 0,
                buttons: buttons.length > 0,
                inputsVisible: Array.from(inputs).some(el => el.offsetParent !== null),
                buttonsVisible: Array.from(buttons).some(el => el.offsetParent !== null),
            }
        })

        if (!hasInteractiveElements.inputsVisible || !hasInteractiveElements.buttonsVisible) {
            console.warn(`[BrowserLLM] ⚠️ Missing interactive elements: ${JSON.stringify(hasInteractiveElements)}`)
        }

        console.log(`[BrowserLLM] ✓ Page healthy: ${JSON.stringify(errorIndicators)}`)
        return { healthy: true, reason: 'OK' }
    } catch (e) {
        const screenshot = await takeDebugScreenshot(page, ai, 'health-check-error')
        console.error(`[BrowserLLM] Health check error: ${e.message}`)
        return { healthy: false, reason: e.message, screenshot }
    }
}

// ════════════════════════════════════════════════════════════════
// CDP FALLBACK FUNCTIONS — Direct Protocol Commands
// Bypass DOM timeouts with Chrome DevTools Protocol
// ════════════════════════════════════════════════════════════════

/**
 * Force click via CDP when Puppeteer selector times out
 * Uses Input.dispatchMouseEvent to send physical mouse clicks
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector to click
 * @param {string} agent - Agent name for debugging
 * @param {number} timeout - Max wait for CDP session (ms)
 * @returns {boolean} true if click succeeded
 */
async function forceClickCDP(page, selector, agent = 'unknown', timeout = 5000) {
    try {
        console.log(`[BrowserLLM] 🖱️  Force click via CDP: ${selector}`)
        const cdpSession = await page.target().createCDPSession()

        // Get element bounding box with visual info
        // eslint-disable-next-line no-undef
        const bbox = await page.evaluate((sel) => {
            const el = document.querySelector(sel)
            if (!el) return null
            const rect = el.getBoundingClientRect()
            // eslint-disable-next-line no-undef
            const style = window.getComputedStyle(el)
            return {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                visible: rect.width > 0 && rect.height > 0,
                width: rect.width,
                height: rect.height,
                tagName: el.tagName,
                className: el.className,
                opacity: style.opacity,
                display: style.display
            }
        }, selector)

        if (!bbox) {
            console.warn(`[BrowserLLM] ❌ Element selector not found: ${selector}`)
            await takeDebugScreenshot(page, agent, 'click-selector-not-found')
            await cdpSession.detach()
            return false
        }

        if (!bbox.visible) {
            console.warn(`[BrowserLLM] ❌ Element not visible: ${JSON.stringify(bbox)}`)
            await takeDebugScreenshot(page, agent, 'click-not-visible')
            await cdpSession.detach()
            return false
        }

        console.log(`[BrowserLLM] Element found: ${bbox.tagName}.${bbox.className} (${bbox.width}x${bbox.height})`)

        // Dispatch mouse down
        await cdpSession.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x: bbox.x,
            y: bbox.y,
            button: 'left',
            clickCount: 1
        })

        await new Promise(r => setTimeout(r, 50))

        // Dispatch mouse up
        await cdpSession.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x: bbox.x,
            y: bbox.y,
            button: 'left',
            clickCount: 1
        })

        await cdpSession.detach()
        console.log(`[BrowserLLM] ✓ Force click succeeded: ${selector}`)
        await takeDebugScreenshot(page, agent, 'click-success')
        return true
    } catch (e) {
        console.error(`[BrowserLLM] ❌ Force click failed: ${e.message}`)
        await takeDebugScreenshot(page, agent, 'click-error')
        return false
    }
}

/**
 * Force type via CDP when Puppeteer keyboard times out
 * Uses Input.insertText to send keystrokes directly
 * @param {Page} page - Puppeteer page object
 * @param {string} text - Text to type
 * @param {string} agent - Agent name for debugging
 * @param {number} chunkSize - Characters per batch (default 500)
 * @returns {boolean} true if typing succeeded
 */
async function forceTypeCDP(page, text, agent = 'unknown', chunkSize = 500) {
    try {
        console.log(`[BrowserLLM] ⌨️  Force type via CDP: ${text.length} chars (${Math.ceil(text.length / chunkSize)} chunks)`)
        const cdpSession = await page.target().createCDPSession()

        // First, check what element is focused
        const focusedInfo = await page.evaluate(() => {
            const focused = document.activeElement
            if (focused) {
                focused.focus()
                return {
                    tagName: focused.tagName,
                    type: focused.type,
                    className: focused.className,
                    contenteditable: focused.contentEditable,
                    value: focused.value ? focused.value.substring(0, 50) : 'N/A'
                }
            }
            return { error: 'No element focused' }
        })

        console.log(`[BrowserLLM] Focused element: ${JSON.stringify(focusedInfo)}`)

        // Send text in chunks to avoid overwhelming the renderer
        for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = text.slice(i, i + chunkSize)
            const chunkNum = Math.floor(i / chunkSize) + 1
            console.log(`[BrowserLLM] Typing chunk ${chunkNum}/${Math.ceil(text.length / chunkSize)} (${chunk.length} chars)`)

            await cdpSession.send('Input.insertText', {
                text: chunk
            })
            await new Promise(r => setTimeout(r, 100))
        }

        await cdpSession.detach()
        console.log(`[BrowserLLM] ✓ Force type succeeded: ${text.length} chars`)
        await takeDebugScreenshot(page, agent, 'type-success')
        return true
    } catch (e) {
        console.error(`[BrowserLLM] ❌ Force type failed: ${e.message}`)
        await takeDebugScreenshot(page, agent, 'type-error')
        return false
    }
}

/**
 * Combined: Try Puppeteer method, fallback to CDP
 */
async function clickWithFallback(page, selector, agent = 'unknown', timeout = 15000) {
    try {
        // Try native Puppeteer first
        const element = await page.waitForSelector(selector, { timeout: Math.min(timeout, 3000) })
        if (element) {
            await element.click()
            console.log(`[BrowserLLM] ✓ Click succeeded (native): ${selector}`)
            return true
        }
    } catch (e) {
        console.warn(`[BrowserLLM] Native click failed (${e.message}), trying CDP...`)
    }

    // Fallback to CDP
    return await forceClickCDP(page, selector, agent, timeout)
}

/**
 * Combined: Try Puppeteer method, fallback to CDP
 */
async function typeWithFallback(page, selector, text, agent = 'unknown', timeout = 15000) {
    try {
        // Try native Puppeteer first
        const input = await page.waitForSelector(selector, { timeout: Math.min(timeout, 3000) })
        if (input) {
            await input.click()
            await new Promise(r => setTimeout(r, 300))
            await page.keyboard.type(text, { delay: 10 })
            console.log(`[BrowserLLM] ✓ Type succeeded (native): ${selector}`)
            return true
        }
    } catch (e) {
        console.warn(`[BrowserLLM] Native type failed (${e.message}), trying CDP...`)
    }

    // Fallback to CDP
    return await forceTypeCDP(page, text, agent, timeout)
}

/**
 * AI Web UI Drivers — selectors and behavior for each AI
 */
const AI_DRIVERS = {
    chatgpt: {
        name: 'ChatGPT',
        emoji: '💚',
        url: 'https://chatgpt.com',
        newChatUrl: 'https://chatgpt.com/',
        async toggleProMode(page, options) {
            // Options would eventually dictate if Pro is on/off, defaulting to on for Search/Matrix agents
            try {
                // Look for Search/Deep Research button (usually toggleable)
                const searchBtn = await page.$('button[aria-label="Search"], button[aria-label="Web Search"], button[aria-label="Deep Research"]')
                if (searchBtn) {
                    const isPressed = await page.evaluate(el => el.getAttribute('aria-pressed') === 'true', searchBtn)
                    if (!isPressed) {
                        await searchBtn.click()
                        await new Promise(r => setTimeout(r, 500))
                        console.log('[BrowserLLM] ChatGPT Pro Mode (Search) enabled')
                    }
                }
            } catch (e) {
                console.log('[BrowserLLM] Could not toggle ChatGPT Pro mode:', e.message)
            }
        },
        async countResponses(page) {
            return await page.evaluate(() => document.querySelectorAll('[data-message-author-role="assistant"]').length)
        },
        async toggleProMode(page, options) {
            // Enable Search/Deep Research for Agent 1
            if (options?.agentId == 1) {
                try {
                    // Find the Search 'Globe' button
                    const searchBtn = await page.$('button[aria-label="Search"]')
                    if (searchBtn) {
                        // Check if it's already active (usually has text-blue-500 or similar active class)
                        const className = await page.evaluate(el => el.className, searchBtn)
                        if (!className.includes('bg-token-main-surface-secondary') && !className.includes('active')) {
                            await searchBtn.click()
                            console.log('[BrowserLLM] ChatGPT Web Search Enabled')
                            await sleep(500)
                        }
                    }
                } catch (e) {
                    console.log(`[BrowserLLM] Could not toggle ChatGPT Search: ${e.message}`)
                }
            }
        },
        async typePrompt(page, text) {
            // Health check before attempting interaction
            const health = await healthCheckPage(page, 'chatgpt')
            if (!health.healthy) {
                throw new Error(`ChatGPT page unhealthy: ${health.reason}`)
            }

            const selector = await getAdaptiveSelector(page.url(), {
                hints: ['#prompt-textarea', '[data-id="root"] textarea', '[data-testid="prompt-textarea"]'],
                fallback: '#prompt-textarea'
            })

            // Try native method first, fallback to CDP if times out
            const success = await typeWithFallback(page, selector, text, 'chatgpt', 15000)
            if (!success) {
                console.warn('[BrowserLLM] ❌ ChatGPT typePrompt failed with both methods')
                await takeDebugScreenshot(page, 'chatgpt', 'typePrompt-failed')
                throw new Error('Failed to type prompt in ChatGPT after native and CDP attempts')
            }

            // Trigger native react events so it registers the input
            try {
                await page.keyboard.press('Space')
                await page.keyboard.press('Backspace')
                await sleep(1000)
            } catch (e) {
                console.warn('[BrowserLLM] Could not trigger react events:', e.message)
            }
        },
        async sendMessage(page) {
            try {
                // Try to click send button with fallback
                const clicked = await clickWithFallback(page, 'button[data-testid="send-button"]', 'chatgpt', 5000)
                if (clicked) {
                    return
                }
            } catch (e) {
                console.warn('[BrowserLLM] Send button click failed:', e.message)
                await takeDebugScreenshot(page, 'chatgpt', 'sendMessage-click-failed')
            }

            // Fallback: press Enter
            try {
                await page.keyboard.press('Enter')
            } catch (e) {
                console.warn('[BrowserLLM] ❌ Enter key also failed:', e.message)
                await takeDebugScreenshot(page, 'chatgpt', 'sendMessage-keyboard-failed')
                throw new Error('Could not send message in ChatGPT', { cause: e })
            }
        },
        async waitForResponse(page, initialCount, timeout = 300000) {
            console.log(`[BrowserLLM] ⏳ ChatGPT waiting for response... (initial count: ${initialCount}, timeout: ${timeout}ms)`)

            // Step 1: Wait for a NEW message to be added to DOM
            try {
                console.log(`[BrowserLLM] Step 1: Waiting for new assistant message...`)
                const startTime = Date.now()
                await page.waitForFunction((initial) => {
                    const count = document.querySelectorAll('[data-message-author-role="assistant"]').length
                    return count > initial
                }, { timeout: Math.min(timeout, 30000), polling: 1000 }, initialCount)
                const elapsed = Date.now() - startTime
                console.log(`[BrowserLLM] ✓ New message detected in ${elapsed}ms`)
            } catch (e) {
                console.warn(`[BrowserLLM] ⚠️ Timeout waiting for ChatGPT new message element: ${e.message}`)
                await takeDebugScreenshot(page, 'chatgpt', 'waitForResponse-no-message')
            }

            await sleep(2000)

            // Step 2: Wait for streaming to finish (stop button disappears)
            try {
                console.log(`[BrowserLLM] Step 2: Waiting for generation to finish...`)
                const startTime = Date.now()
                await page.waitForFunction(() => {
                    const stopBtn = document.querySelector('button[aria-label="Stop generating"], [data-testid="stop-button"]')
                    return !stopBtn
                }, { timeout: Math.min(timeout, 30000), polling: 1000 })
                const elapsed = Date.now() - startTime
                console.log(`[BrowserLLM] ✓ Generation finished in ${elapsed}ms`)
            } catch (e) {
                console.warn(`[BrowserLLM] ⚠️ Timeout waiting for ChatGPT stream to finish: ${e.message}`)
                await takeDebugScreenshot(page, 'chatgpt', 'waitForResponse-still-generating')
            }

            await sleep(2000)
        },
        async extractResponse(page) {
            return await page.evaluate(() => {
                // Get fresh nodes directly from the DOM to avoid Detached Node errors
                const msgs = document.querySelectorAll('[data-message-author-role="assistant"]')
                if (msgs.length === 0) return ''
                return msgs[msgs.length - 1].innerText || msgs[msgs.length - 1].textContent || ''
            })
        },
    },

    claude: {
        name: 'Claude',
        emoji: '🟠',
        url: 'https://claude.ai',
        newChatUrl: 'https://claude.ai/new',
        async countResponses(page) {
            return await page.evaluate(() => document.querySelectorAll('.font-claude-message').length)
        },
        async toggleProMode(page, options) {
            // Always try to enable Extended Thinking for Claude if available (Great for all Council tasks)
            try {
                // Find "Extended thinking" button or similar toggle
                // Claude usually has a button with "thinking" in the tooltip/aria-label or text
                const thinkingBtn = await page.evaluateHandle(() => {
                    const buttons = Array.from(document.querySelectorAll('button'))
                    return buttons.find(b => b.textContent.toLowerCase().includes('thinking') ||
                        (b.getAttribute('aria-label') && b.getAttribute('aria-label').toLowerCase().includes('thinking')))
                })

                if (thinkingBtn) {
                    const isPressed = await page.evaluate(el => el.getAttribute('aria-pressed') === 'true' || el.getAttribute('data-state') === 'on', thinkingBtn)
                    if (!isPressed) {
                        await thinkingBtn.click()
                        console.log('[BrowserLLM] Claude Extended Thinking Enabled')
                        await sleep(500)
                    }
                }
            } catch (e) {
                console.log(`[BrowserLLM] Could not toggle Claude Extended Thinking: ${e.message}`)
            }
        },
        async typePrompt(page, text) {
            // Health check before attempting interaction
            const health = await healthCheckPage(page, 'claude')
            if (!health.healthy) {
                throw new Error(`Claude page unhealthy: ${health.reason}`)
            }

            const selector = await getAdaptiveSelector(page.url(), {
                hints: ['[contenteditable="true"].ProseMirror', 'div[contenteditable="true"]', '.ProseMirror'],
                fallback: '[contenteditable="true"].ProseMirror, div[contenteditable="true"]'
            })

            // Try native method first, fallback to CDP if times out
            const success = await typeWithFallback(page, selector, text, 'claude', 15000)
            if (!success) {
                console.warn('[BrowserLLM] ❌ Claude typePrompt failed with both methods')
                await takeDebugScreenshot(page, 'claude', 'typePrompt-failed')
                throw new Error('Failed to type prompt in Claude after native and CDP attempts')
            }

            // Trigger react events to register the input
            try {
                await page.keyboard.press('Space')
                await page.keyboard.press('Backspace')
                await sleep(1000)
            } catch (e) {
                console.warn('[BrowserLLM] Could not trigger react events:', e.message)
            }
        },
        async sendMessage(page) {
            try {
                // Try send button with fallback
                const clicked = await clickWithFallback(page, 'button[aria-label="Send Message"], button[type="submit"]', 'claude', 5000)
                if (clicked) {
                    return
                }
            } catch (e) {
                console.warn('[BrowserLLM] Send button click failed:', e.message)
                await takeDebugScreenshot(page, 'claude', 'sendMessage-click-failed')
            }

            // Fallback: press Enter
            try {
                await page.keyboard.press('Enter')
            } catch (e) {
                console.warn('[BrowserLLM] ❌ Enter key also failed:', e.message)
                await takeDebugScreenshot(page, 'claude', 'sendMessage-keyboard-failed')
                throw new Error('Could not send message in Claude', { cause: e })
            }
        },
        async waitForResponse(page, initialCount, timeout = 300000) {
            console.log(`[BrowserLLM] ⏳ Claude waiting for response... (initial count: ${initialCount}, timeout: ${timeout}ms)`)

            // Step 1: Wait for new message element to appear
            try {
                console.log(`[BrowserLLM] Step 1: Waiting for new message element...`)
                const startTime = Date.now()
                await page.waitForFunction((initial) => {
                    const count = document.querySelectorAll('.font-claude-message').length
                    return count > initial
                }, { timeout: Math.min(timeout, 30000), polling: 1000 }, initialCount)
                const elapsed = Date.now() - startTime
                console.log(`[BrowserLLM] ✓ New message detected in ${elapsed}ms`)
            } catch (e) {
                console.warn(`[BrowserLLM] ⚠️ Timeout waiting for Claude new message element: ${e.message}`)
                await takeDebugScreenshot(page, 'claude', 'waitForResponse-no-message')
            }

            await sleep(2000)

            // Step 2: Wait for streaming to complete (stop button disappears)
            try {
                console.log(`[BrowserLLM] Step 2: Waiting for generation to finish...`)
                const startTime = Date.now()
                await page.waitForFunction(() => {
                    return !document.querySelector('.stop-button') &&
                        !document.querySelector('button[aria-label="Stop generating"]')
                }, { timeout: Math.min(timeout, 30000), polling: 1000 })
                const elapsed = Date.now() - startTime
                console.log(`[BrowserLLM] ✓ Generation finished in ${elapsed}ms`)
            } catch (e) {
                console.warn(`[BrowserLLM] ⚠️ Timeout waiting for Claude stream to finish: ${e.message}`)
                await takeDebugScreenshot(page, 'claude', 'waitForResponse-still-generating')
            }

            await sleep(2000)
        },
        async extractResponse(page) {
            return await page.evaluate(() => {
                // Get fresh nodes directly from the DOM to avoid Detached Node errors
                const msgs = document.querySelectorAll('.font-claude-message')
                if (msgs.length === 0) return ''
                return msgs[msgs.length - 1].innerText || ''
            })
        },
    },

    gemini: {
        name: 'Gemini',
        emoji: '🔵',
        url: 'https://gemini.google.com',
        newChatUrl: 'https://gemini.google.com/app',
        async countResponses(page) {
            return await page.evaluate(() => document.querySelectorAll('message-content, .model-response-text').length)
        },
        async typePrompt(page, text) {
            // Health check before attempting interaction
            const health = await healthCheckPage(page, 'gemini')
            if (!health.healthy) {
                throw new Error(`Gemini page unhealthy: ${health.reason}`)
            }

            const selector = await getAdaptiveSelector(page.url(), {
                hints: ['.ql-editor', 'div[contenteditable="true"]', '.input-area [contenteditable]', 'rich-textarea'],
                fallback: '.ql-editor, div[contenteditable="true"], .input-area [contenteditable]'
            })

            // Try native method first, fallback to CDP if times out
            const success = await typeWithFallback(page, selector, text, 'gemini', 15000)
            if (!success) {
                console.warn('[BrowserLLM] ❌ Gemini typePrompt failed with both methods')
                await takeDebugScreenshot(page, 'gemini', 'typePrompt-failed')
                throw new Error('Failed to type prompt in Gemini after native and CDP attempts')
            }

            // Trigger react events to register the input
            try {
                await page.keyboard.press('Space')
                await page.keyboard.press('Backspace')
                await sleep(1500) // Gemini needs a bit more time to register
            } catch (e) {
                console.warn('[BrowserLLM] Could not trigger react events:', e.message)
            }
        },
        async sendMessage(page) {
            try {
                // Try to click send button with fallback
                const clicked = await clickWithFallback(page, 'button[aria-label="Send message"], button[mattooltip="Send"], .send-button', 'gemini', 5000)
                if (clicked) {
                    return
                }
            } catch (e) {
                console.warn('[BrowserLLM] Send button click failed:', e.message)
                await takeDebugScreenshot(page, 'gemini', 'sendMessage-click-failed')
            }

            // Fallback: Cmd+Enter key combo
            try {
                await page.keyboard.down('Meta')
                await page.keyboard.press('Enter')
                await page.keyboard.up('Meta')
            } catch (e) {
                console.warn('[BrowserLLM] ❌ Cmd+Enter also failed:', e.message)
                await takeDebugScreenshot(page, 'gemini', 'sendMessage-keyboard-failed')
                throw new Error('Could not send message in Gemini', { cause: e })
            }
        },
        async waitForResponse(page, initialCount, timeout = 300000) {
            console.log(`[BrowserLLM] ⏳ Gemini waiting for response... (initial count: ${initialCount}, timeout: ${timeout}ms)`)

            // Step 1: Wait for new message element to appear
            try {
                console.log(`[BrowserLLM] Step 1: Waiting for new message element...`)
                const startTime = Date.now()
                await page.waitForFunction((initial) => {
                    const count = document.querySelectorAll('message-content, .model-response-text').length
                    return count > initial
                }, { timeout: Math.min(timeout, 30000), polling: 1000 }, initialCount)
                const elapsed = Date.now() - startTime
                console.log(`[BrowserLLM] ✓ New message detected in ${elapsed}ms`)
            } catch (e) {
                console.warn(`[BrowserLLM] ⚠️ Timeout waiting for Gemini new message element: ${e.message}`)
                await takeDebugScreenshot(page, 'gemini', 'waitForResponse-no-message')
            }

            await sleep(3000)

            // Step 2: Wait for generation (spinner) to finish
            try {
                console.log(`[BrowserLLM] Step 2: Waiting for generation to finish...`)
                const startTime = Date.now()
                await page.waitForFunction(() => {
                    const loading = document.querySelector('.loading-indicator, mat-progress-bar, .thinking-indicator, [data-test-id="generating-indicator"]')
                    return !loading
                }, { timeout: Math.min(timeout, 30000), polling: 1000 })
                const elapsed = Date.now() - startTime
                console.log(`[BrowserLLM] ✓ Generation finished in ${elapsed}ms`)
            } catch (e) {
                console.warn(`[BrowserLLM] ⚠️ Timeout waiting for Gemini stream to finish: ${e.message}`)
                await takeDebugScreenshot(page, 'gemini', 'waitForResponse-still-generating')
            }

            await sleep(2000)
        },
        async extractResponse(page) {
            return await page.evaluate(() => {
                // Get fresh nodes directly from the DOM to avoid Detached Node errors
                const msgs = document.querySelectorAll('message-content, .model-response-text, .response-content')
                if (msgs.length === 0) return ''
                return msgs[msgs.length - 1].innerText || msgs[msgs.length - 1].textContent || ''
            })
        },
    },

    grok: {
        name: 'Grok',
        emoji: '🏴‍☠️',
        url: 'https://grok.com',
        newChatUrl: 'https://grok.com',
        async countResponses(page) {
            return await page.evaluate(() => document.querySelectorAll('.message-row, .message').length)
        },
        async typePrompt(page, text) {
            // Health check before attempting interaction
            const health = await healthCheckPage(page, 'grok')
            if (!health.healthy) {
                throw new Error(`Grok page unhealthy: ${health.reason}`)
            }

            const selector = await getAdaptiveSelector(page.url(), {
                hints: ['textarea[placeholder*="Ask Grok"]', 'textarea', '[contenteditable="true"]'],
                fallback: 'textarea'
            })

            // Try native method first, fallback to CDP if times out
            const success = await typeWithFallback(page, selector, text, 'grok', 15000)
            if (!success) {
                console.warn('[BrowserLLM] ❌ Grok typePrompt failed with both methods')
                await takeDebugScreenshot(page, 'grok', 'typePrompt-failed')
                throw new Error('Failed to type prompt in Grok after native and CDP attempts')
            }
        },
        async sendMessage(page) {
            try {
                // Try send button with fallback
                const clicked = await clickWithFallback(page, 'button[aria-label="Grok something"], button[type="submit"]', 'grok', 5000)
                if (clicked) {
                    return
                }
            } catch (e) {
                console.warn('[BrowserLLM] Send button click failed:', e.message)
                await takeDebugScreenshot(page, 'grok', 'sendMessage-click-failed')
            }

            // Fallback: press Enter
            try {
                await page.keyboard.press('Enter')
            } catch (e) {
                console.warn('[BrowserLLM] ❌ Enter key also failed:', e.message)
                await takeDebugScreenshot(page, 'grok', 'sendMessage-keyboard-failed')
                throw new Error('Could not send message in Grok', { cause: e })
            }
        },
        async waitForResponse(page, initialCount, timeout = 300000) {
            console.log(`[BrowserLLM] ⏳ Grok waiting for response... (initial count: ${initialCount}, timeout: ${timeout}ms)`)

            // Step 1: Wait for new message element to appear
            try {
                console.log(`[BrowserLLM] Step 1: Waiting for new message element...`)
                const startTime = Date.now()
                await page.waitForFunction((initial) => {
                    const count = document.querySelectorAll('.message-row, .message').length
                    return count > initial
                }, { timeout: Math.min(timeout, 30000), polling: 1000 }, initialCount)
                const elapsed = Date.now() - startTime
                console.log(`[BrowserLLM] ✓ New message detected in ${elapsed}ms`)
            } catch (e) {
                console.warn(`[BrowserLLM] ⚠️ Timeout waiting for Grok new message element: ${e.message}`)
                await takeDebugScreenshot(page, 'grok', 'waitForResponse-no-message')
            }

            await sleep(3000)

            // Step 2: Wait for streaming to complete (stop button disappears)
            try {
                console.log(`[BrowserLLM] Step 2: Waiting for generation to finish...`)
                const startTime = Date.now()
                await page.waitForFunction(() => {
                    const stopBtn = document.querySelector('button[aria-label="Stop generating"]')
                    return !stopBtn
                }, { timeout: Math.min(timeout, 30000), polling: 1000 })
                const elapsed = Date.now() - startTime
                console.log(`[BrowserLLM] ✓ Generation finished in ${elapsed}ms`)
            } catch (e) {
                console.warn(`[BrowserLLM] ⚠️ Timeout waiting for Grok stream to finish: ${e.message}`)
                await takeDebugScreenshot(page, 'grok', 'waitForResponse-still-generating')
            }

            await sleep(2000)
        },
        async extractResponse(page) {
            return await page.evaluate(() => {
                const msgs = document.querySelectorAll('.message-row .message, .message')
                if (msgs.length === 0) return ''
                return msgs[msgs.length - 1].innerText || msgs[msgs.length - 1].textContent || ''
            })
        },
    },
}

/**
 * Connect to the user's Chrome instance via CDP
 * Chrome must be running with remote debugging enabled
 */
export async function connectToChrome(port = 9222) {
    if (browser) return browser

    try {
        browser = await puppeteer.connect({
            browserURL: `http://127.0.0.1:${port}`,
            defaultViewport: null,
            protocolTimeout: 300000, // 5 minutes for heavy prompts
        })
        console.log('[BrowserLLM] Connected to Chrome via CDP')
        return browser
    } catch (e) {
        throw new Error(
            `Cannot connect to Chrome on port ${port}. Start Chrome with:\n` +
            `  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${port}\n` +
            `Error: ${e.message}`,
            { cause: e }
        )
    }
}

/**
 * Find or create a tab for a specific AI
 */
async function getAITab(aiId) {
    const driver = AI_DRIVERS[aiId]
    if (!driver) throw new Error(`Unknown AI: ${aiId}`)

    if (!browser) throw new Error('Browser not connected. Call connectToChrome() first.')

    // Check if we already have a page for this AI
    if (pages[aiId]) {
        try {
            await pages[aiId].url() // Check if page is still valid
            return pages[aiId]
        } catch {
            delete pages[aiId]
        }
    }

    // Find existing tab
    const allPages = await browser.pages()
    for (const page of allPages) {
        const url = await page.url()
        if (url.includes(new URL(driver.url).hostname)) {
            pages[aiId] = page
            console.log(`[BrowserLLM] Found existing ${driver.name} tab: ${url}`)
            return page
        }
    }

    // Open new tab if not found
    const page = await browser.newPage()
    await page.goto(driver.newChatUrl, { waitUntil: 'networkidle2', timeout: 30000 })
    pages[aiId] = page
    console.log(`[BrowserLLM] Opened new ${driver.name} tab`)
    return page
}

// Global lock to serialize browser UI interactions across parallel requests
let browserLock = Promise.resolve()

/**
 * Send a prompt to a specific AI and get the response
 * @param {string} aiId - 'chatgpt' | 'claude' | 'gemini'
 * @param {string} prompt - Full prompt text (system + user combined)
 * @param {object} options - Options context (e.g. agentId)
 * @param {function} onProgress - Callback mapping
 * @returns {string} The AI's response text
 */
export async function sendToAI(aiId, prompt, options = {}, onProgress = null) {
    const driver = AI_DRIVERS[aiId]
    if (!driver) throw new Error(`Unknown AI: ${aiId}`)

    // Acquire lock for browser interaction (typing and sending)
    let releaseLock
    const lockPromise = new Promise(resolve => { releaseLock = resolve })
    const currentLock = browserLock
    browserLock = browserLock.then(() => lockPromise)

    await currentLock // wait for our turn to use the browser UI

    let page, initialCount
    try {
        page = await getAITab(aiId)

        // Navigate to new chat
        if (onProgress) onProgress({ type: 'ai_navigating', ai: aiId, name: driver.name })
        await page.goto(driver.newChatUrl, { waitUntil: 'networkidle2', timeout: 30000 })
        await sleep(2000)

        // Count initial responses before sending
        initialCount = await driver.countResponses(page)

        // Enable Pro Features (Search / Reasoning)
        if (driver.toggleProMode) {
            if (onProgress) onProgress({ type: 'ai_toggling_pro', ai: aiId, name: driver.name })
            await driver.toggleProMode(page, options)
        }

        // Type the prompt
        if (onProgress) onProgress({ type: 'ai_typing', ai: aiId, name: driver.name })
        await driver.typePrompt(page, prompt)

        // Send the message
        if (onProgress) onProgress({ type: 'ai_sending', ai: aiId, name: driver.name })
        await driver.sendMessage(page)

        // Wait a tiny bit just to let UI register click before releasing lock
        await sleep(1000)
    } finally {
        // Release lock so other parallel AIs can type in their tabs
        releaseLock()
    }

    // --- PARALLEL WAITING PHASE ---
    // The browser runs these streams concurrently in background tabs!

    // Wait for complete response
    if (onProgress) onProgress({ type: 'ai_thinking', ai: aiId, name: driver.name, emoji: driver.emoji })
    await driver.waitForResponse(page, initialCount)

    // Extract response text
    if (onProgress) onProgress({ type: 'ai_extracting', ai: aiId, name: driver.name })
    const response = await driver.extractResponse(page)

    if (!response || response.length < 50) {
        console.warn(`[BrowserLLM] ${driver.name} response seems short (${response.length} chars)`)
    }

    console.log(`[BrowserLLM] ${driver.emoji} ${driver.name}: ${response.length} chars extracted`)
    return response
}

/**
 * Check which AIs are available (have open tabs with active sessions)
 */
export async function checkAvailableAIs() {
    if (!browser) {
        const error = '[CRITICAL] Browser not connected. Call connectToChrome() first.'
        console.error(`[BrowserLLM] ${error}`)
        throw new Error(error)
    }

    const allPages = await browser.pages()
    const available = {}
    let foundCount = 0

    for (const [id, driver] of Object.entries(AI_DRIVERS)) {
        const hostname = new URL(driver.url).hostname
        const found = allPages.some(p => {
            try { return p.url().includes(hostname) } catch { return false }
        })
        if (found) foundCount++
        available[id] = {
            name: driver.name,
            emoji: driver.emoji,
            available: found,
        }
    }

    // CRITICAL VALIDATION: If NO LLM tabs found, throw explicit error
    if (foundCount === 0) {
        const error = '[CRITICAL] Nenhuma aba de LLM conectada. Verifique as URLs no Chrome da porta 9222'
        console.error(`[BrowserLLM] ${error}`)
        console.error(`[BrowserLLM] Total de abas abertas: ${allPages.length}`)
        console.error(`[BrowserLLM] Abas esperadas: chatgpt.com, claude.ai, gemini.google.com, grok.com`)

        // Log first 10 tab URLs for debugging
        console.error(`[BrowserLLM] URLs abertas:`)
        allPages.slice(0, 10).forEach((p, idx) => {
            try {
                console.error(`  [${idx}] ${p.url().substring(0, 80)}`)
            } catch (e) {
                console.error(`  [${idx}] <página inacessível>`)
            }
        })

        throw new Error(error)
    }

    console.log(`[BrowserLLM] ✓ Abas de LLM detectadas: ${foundCount}/4 agentes disponíveis`)
    return { connected: true, ais: available }
}

/**
 * Get driver info
 */
export function getAIDrivers() {
    return Object.entries(AI_DRIVERS).map(([id, d]) => ({
        id,
        name: d.name,
        emoji: d.emoji,
        url: d.url,
    }))
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
