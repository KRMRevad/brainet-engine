/**
 * BRAINET Browser LLM Driver
 * Controls ChatGPT, Claude, and Gemini via Puppeteer CDP
 * Connects to the user's existing Chrome session with active logins
 */

import puppeteer from 'puppeteer-core'

let browser = null
let pages = {}

/**
 * AI Web UI Drivers — selectors and behavior for each AI
 */
const AI_DRIVERS = {
    chatgpt: {
        name: 'ChatGPT',
        emoji: '💚',
        url: 'https://chatgpt.com',
        newChatUrl: 'https://chatgpt.com/',
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
            const input = await page.waitForSelector('#prompt-textarea', { timeout: 15000 })
            await input.click()
            await sleep(500)
            await page.keyboard.down('Meta')
            await page.keyboard.press('a')
            await page.keyboard.up('Meta')
            await page.keyboard.press('Backspace')

            // Insert large texts in chunks so we don't freeze the Chrome renderer
            const chunkSize = 4000
            for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.slice(i, i + chunkSize)
                await page.evaluate((t) => {
                    const el = document.querySelector('#prompt-textarea')
                    if (el) {
                        el.focus()
                        document.execCommand('insertText', false, t)
                    }
                }, chunk)
                await sleep(100)
            }

            // Trigger native react events so it registers the input
            await page.keyboard.press('Space')
            await page.keyboard.press('Backspace')
            await sleep(1000)
        },
        async sendMessage(page) {
            const sendBtn = await page.$('button[data-testid="send-button"]')
            if (sendBtn) {
                await sendBtn.click()
            } else {
                await page.keyboard.press('Enter')
            }
        },
        async waitForResponse(page, initialCount, timeout = 300000) {
            console.log(`[BrowserLLM] ChatGPT waiting for response... (initial count: ${initialCount})`)

            // 1. Wait for a NEW message to be added to DOM
            await page.waitForFunction((initial) => {
                return document.querySelectorAll('[data-message-author-role="assistant"]').length > initial
            }, { timeout, polling: 1000 }, initialCount).catch(() => console.log('Timeout waiting for ChatGPT new message element'))

            await sleep(2000)

            // 2. Wait for streaming to finish (stop button disappears)
            await page.waitForFunction(() => {
                return !document.querySelector('button[aria-label="Stop generating"], [data-testid="stop-button"]')
            }, { timeout, polling: 1000 }).catch(() => console.log('Timeout waiting for ChatGPT stream to finish'))

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
            const input = await page.waitForSelector('[contenteditable="true"].ProseMirror, div[contenteditable="true"]', { timeout: 15000 })
            await input.click()
            await sleep(500)
            await page.keyboard.down('Meta')
            await page.keyboard.press('a')
            await page.keyboard.up('Meta')
            await page.keyboard.press('Backspace')

            const chunkSize = 4000
            for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.slice(i, i + chunkSize)
                await page.evaluate((t) => {
                    const el = document.querySelector('[contenteditable="true"].ProseMirror') ||
                        document.querySelector('div[contenteditable="true"]')
                    if (el) {
                        el.focus()
                        document.execCommand('insertText', false, t)
                    }
                }, chunk)
                await sleep(100)
            }

            await page.keyboard.press('Space')
            await page.keyboard.press('Backspace')
            await sleep(1000)
        },
        async sendMessage(page) {
            const sendBtn = await page.$('button[aria-label="Send Message"]') ||
                await page.$('button[type="submit"]')
            if (sendBtn) {
                await sendBtn.click()
            } else {
                await page.keyboard.press('Enter')
            }
        },
        async waitForResponse(page, initialCount, timeout = 300000) {
            console.log(`[BrowserLLM] Claude waiting for response... (initial count: ${initialCount})`)

            // Wait for new message
            await page.waitForFunction((initial) => {
                return document.querySelectorAll('.font-claude-message').length > initial
            }, { timeout, polling: 1000 }, initialCount).catch(() => console.log('Timeout waiting for Claude new message element'))

            await sleep(2000)

            // Wait for streaming to complete
            await page.waitForFunction(() => {
                return !document.querySelector('.stop-button') &&
                    !document.querySelector('button[aria-label="Stop generating"]')
            }, { timeout, polling: 1000 }).catch(() => console.log('Timeout waiting for Claude stream to finish'))

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
            const input = await page.waitForSelector('.ql-editor, div[contenteditable="true"], .input-area [contenteditable]', { timeout: 15000 })
            await input.click()
            await sleep(500)

            await page.keyboard.down('Meta')
            await page.keyboard.press('a')
            await page.keyboard.up('Meta')
            await page.keyboard.press('Backspace')

            const chunkSize = 4000
            for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.slice(i, i + chunkSize)
                await page.evaluate((t) => {
                    const el = document.querySelector('.ql-editor') ||
                        document.querySelector('div[contenteditable="true"]')
                    if (el) {
                        el.focus()
                        document.execCommand('insertText', false, t)
                    }
                }, chunk)
                await sleep(100)
            }

            await page.keyboard.press('Space')
            await page.keyboard.press('Backspace')
            await sleep(1500) // Gemini needs a bit more time to register
        },
        async sendMessage(page) {
            // Find send button to ensure it clicks instead of just pressing enter which can be flaky
            const sendBtn = await page.$('button[aria-label="Send message"], button[mattooltip="Send"], .send-button')
            if (sendBtn) {
                await sendBtn.click()
            } else {
                await page.keyboard.down('Meta')
                await page.keyboard.press('Enter')
                await page.keyboard.up('Meta')
            }
        },
        async waitForResponse(page, initialCount, timeout = 300000) {
            console.log(`[BrowserLLM] Gemini waiting for response... (initial count: ${initialCount})`)

            // Wait for new message element to appear
            await page.waitForFunction((initial) => {
                return document.querySelectorAll('message-content, .model-response-text').length > initial
            }, { timeout, polling: 1000 }, initialCount).catch(() => console.log('Timeout waiting for Gemini new message element'))

            await sleep(3000)

            // Wait for generation (spinner) to finish
            await page.waitForFunction(() => {
                const loading = document.querySelector('.loading-indicator, mat-progress-bar, .thinking-indicator, [data-test-id="generating-indicator"]')
                return !loading
            }, { timeout, polling: 1000 }).catch(() => console.log('Timeout waiting for Gemini stream to finish'))

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
            `Error: ${e.message}`
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

    const page = await getAITab(aiId)

    // Navigate to new chat
    if (onProgress) onProgress({ type: 'ai_navigating', ai: aiId, name: driver.name })
    await page.goto(driver.newChatUrl, { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(2000)

    // Count initial responses before sending
    const initialCount = await driver.countResponses(page)

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
    if (!browser) return { connected: false, ais: {} }

    const allPages = await browser.pages()
    const available = {}

    for (const [id, driver] of Object.entries(AI_DRIVERS)) {
        const hostname = new URL(driver.url).hostname
        const found = allPages.some(p => {
            try { return p.url().includes(hostname) } catch { return false }
        })
        available[id] = {
            name: driver.name,
            emoji: driver.emoji,
            available: found,
        }
    }

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
