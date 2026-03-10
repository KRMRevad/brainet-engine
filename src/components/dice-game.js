/**
 * Dice Game Component - T11: Dice animation with skip button
 * Handles luck-based niche selection with accessibility support
 */

/**
 * Initialize dice game
 * T11: Create interactive dice with animation controls
 */
export function initDiceGame(onNichoSelected) {
  const diceContainer = document.querySelector('.dice-container');
  if (!diceContainer) {
    console.warn('Dice container not found');
    return;
  }

  // Create controls wrapper
  const controls = document.createElement('div');
  controls.style.cssText = `
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    align-items: center;
    margin-top: var(--space-lg);
    flex-wrap: wrap;
  `;

  // Dice button
  const diceBtn = document.createElement('button');
  diceBtn.className = 'btn btn-primary dice-btn';
  diceBtn.innerHTML = '🎲 Roll Luck';
  diceBtn.style.cssText = `
    padding: var(--space-md) var(--space-xl);
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  `;

  let isRolling = false;

  diceBtn.onclick = async () => {
    if (isRolling) return;

    isRolling = true;
    diceBtn.disabled = true;
    skipBtn.disabled = true;

    // Start animation
    const diceEl = document.querySelector('.dice');
    if (diceEl) {
      diceEl.classList.add('rolling');

      // Simulate dice roll duration (800ms from CSS animation)
      await new Promise(resolve => setTimeout(resolve, 800));

      diceEl.classList.remove('rolling');
    }

    // Simulate selection
    const nichos = ['espiritualidade', 'saude', 'temperanca', 'paciencia', 'tech', 'filosofia', 'financas', 'artes'];
    const selected = nichos[Math.floor(Math.random() * nichos.length)];

    console.log(`🎲 T11: Dice rolled! Selected: ${selected}`);

    // Call handler
    if (onNichoSelected) {
      onNichoSelected(selected);
    }

    isRolling = false;
    diceBtn.disabled = false;
    skipBtn.disabled = false;
  };

  // Skip button (T11: Skip animation, accessibility feature)
  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn';
  skipBtn.innerHTML = '⏭️ Skip';
  skipBtn.style.cssText = `
    padding: var(--space-md) var(--space-xl);
    font-size: 1rem;
  `;

  skipBtn.onclick = () => {
    console.log('⏭️ T11: Skip luck animation');

    // Go directly to niche selection
    const nichos = ['espiritualidade', 'saude', 'temperanca', 'paciencia', 'tech', 'filosofia', 'financas', 'artes'];
    const selected = nichos[Math.floor(Math.random() * nichos.length)];

    if (onNichoSelected) {
      onNichoSelected(selected);
    }
  };

  // Keyboard shortcut: Space to roll, S to skip
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (!diceBtn.disabled) diceBtn.click();
    }
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      if (!skipBtn.disabled) skipBtn.click();
    }
  });

  controls.appendChild(diceBtn);
  controls.appendChild(skipBtn);

  // Add controls below dice
  const landing = document.querySelector('.landing');
  if (landing) {
    landing.appendChild(controls);
  } else {
    diceContainer.appendChild(controls);
  }

  // Announce to screen readers
  const ariaLive = document.createElement('div');
  ariaLive.setAttribute('aria-live', 'polite');
  ariaLive.setAttribute('aria-label', 'Dice game status');
  ariaLive.style.position = 'absolute';
  ariaLive.style.left = '-9999px';
  document.body.appendChild(ariaLive);

  console.log('✓ T11: Dice game initialized with skip button');
  console.log('  Keyboard shortcuts: Space=Roll, S=Skip');
}

/**
 * Dice animation controller
 * T11: Manage animation state respecting prefers-reduced-motion
 */
export class DiceAnimationController {
  constructor(diceElement) {
    this.dice = diceElement;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen for motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      console.log(`Motion preference changed: ${e.matches ? 'reduced' : 'normal'}`);
    });
  }

  /**
   * Perform dice roll
   * T11: Animation respects prefers-reduced-motion
   */
  async roll() {
    if (!this.dice) return;

    if (this.prefersReducedMotion) {
      // Skip animation, just change state
      console.log('⏭️ Skipping animation due to prefers-reduced-motion');
      return;
    }

    this.dice.classList.add('rolling');

    // Wait for animation to complete
    const animationDuration = 800; // matches CSS animation duration
    await new Promise(resolve => setTimeout(resolve, animationDuration));

    this.dice.classList.remove('rolling');
  }

  /**
   * Check if motion is reduced
   */
  isMotionReduced() {
    return this.prefersReducedMotion;
  }

  /**
   * Instant result (for skip or reduced motion)
   */
  getInstantResult() {
    console.log('✓ T11: Instant result (animation skipped)');
    return this.getRandomNicho();
  }

  /**
   * Get random niche
   */
  getRandomNicho() {
    const nichos = ['espiritualidade', 'saude', 'temperanca', 'paciencia', 'tech', 'filosofia', 'financas', 'artes'];
    return nichos[Math.floor(Math.random() * nichos.length)];
  }
}

/**
 * Create accessible dice button
 * T11 AC-11: Dice game with accessibility
 */
export function createDiceButton(onRoll) {
  const btn = document.createElement('button');
  btn.className = 'dice-btn';
  btn.setAttribute('aria-label', 'Roll the dice to get a random niche');
  btn.setAttribute('aria-pressed', 'false');

  const dice = document.createElement('span');
  dice.className = 'dice';
  dice.setAttribute('aria-hidden', 'true');
  dice.textContent = '🎲';

  const label = document.createElement('span');
  label.textContent = 'Roll Luck';

  btn.appendChild(dice);
  btn.appendChild(label);

  btn.onclick = async () => {
    btn.setAttribute('aria-pressed', 'true');
    btn.disabled = true;

    const controller = new DiceAnimationController(dice);

    if (!controller.isMotionReduced()) {
      await controller.roll();
    }

    const result = controller.getRandomNicho();
    const announcement = document.querySelector('[aria-label="Dice game status"]');
    if (announcement) {
      announcement.textContent = `You rolled: ${result}`;
    }

    if (onRoll) {
      onRoll(result);
    }

    btn.setAttribute('aria-pressed', 'false');
    btn.disabled = false;
  };

  return btn;
}

console.log('✓ T11: Dice game component loaded');
