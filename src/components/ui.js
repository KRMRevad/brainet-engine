/**
 * Atomic UI Components (Tailwind CSS)
 */

export const Button = ({ id = '', text, variant = 'primary', icon = '', extraClasses = '', attrs = '' }) => {
  const baseClasses = 'inline-flex items-center gap-2 px-6 py-2 rounded-full font-body text-sm font-semibold cursor-pointer transition-all duration-300 ease-out';
  
  const variants = {
    primary: 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 border-none',
    secondary: 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-violet-500/50 hover:shadow-lg hover:-translate-y-0.5',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
  };

  const idAttr = id ? `id="${id}"` : '';
  const iconHtml = icon ? `<span>${icon}</span>` : '';

  return `
    <button ${idAttr} class="${baseClasses} ${variants[variant] || variants.primary} ${extraClasses}" ${attrs}>
      ${iconHtml}
      <span>${text}</span>
    </button>
  `;
};

export const GlassCard = ({ id = '', children, extraClasses = '', attrs = '' }) => {
  const idAttr = id ? `id="${id}"` : '';
  return `
    <div ${idAttr} class="bg-[#0f0f1e]/70 backdrop-blur-md border border-[rgba(100,100,180,0.15)] rounded-xl p-6 transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${extraClasses}" ${attrs}>
      ${children}
    </div>
  `;
};

export const Badge = ({ text, color = 'violet', icon = '', extraClasses = '' }) => {
  // Tailwind v4 dynamic colors don't work well with string interpolation for arbitrary values if not safelisted,
  // so we predefine a map of valid classes or use inline styles for dynamic specific hexes.
  // Assuming 'color' is a standard tailwind color name like 'violet', 'emerald', 'cyan', 'amber', etc.
  
  const colorMap = {
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
  };

  const colorClasses = colorMap[color] || colorMap.gray;
  const iconHtml = icon ? `<span class="mr-1">${icon}</span>` : '';

  return `
    <span class="inline-flex items-center px-2.5 py-1 text-xs font-mono font-medium border rounded-full ${colorClasses} ${extraClasses}">
      ${iconHtml}${text}
    </span>
  `;
};
