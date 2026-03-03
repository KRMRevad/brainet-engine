/**
 * PM2 Ecosystem Configuration
 * BRAINET MVP v3.0.0 - Process Management
 *
 * Usage:
 *   - Start:  pm2 start ecosystem.config.js
 *   - Logs:   pm2 logs brainet-server
 *   - Restart: pm2 restart brainet-server
 *   - Stop:   pm2 stop brainet-server
 */

module.exports = {
    apps: [
        {
            // --- BRAINET SERVER ---
            name: 'brainet-server',
            script: 'server/server.js',
            namespace: 'brainet',

            // --- PROCESS MANAGEMENT ---
            instances: 1, // Single instance for MVP (no clustering)
            exec_mode: 'fork', // Not 'cluster' to avoid port conflicts
            max_memory_restart: '500M', // Restart if exceeds 500MB
            max_restarts: 5, // Maximum restart attempts
            min_uptime: '10s', // Minimum uptime before counting as stable
            autorestart: true, // Auto-restart on crash
            restart_delay: 1000, // Wait 1s between restarts
            watch: false, // Disable watch mode in production
            ignore_watch: ['node_modules', 'logs', 'dist'],

            // --- ENVIRONMENT ---
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 3000,
            },

            // --- LOGGING ---
            out_file: 'logs/brainet.out.log',
            err_file: 'logs/brainet.err.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            // --- ERROR HANDLING ---
            kill_timeout: 10000, // 10s to gracefully shutdown
            listen_timeout: 3000, // 3s for port binding
            shutdown_with_message: true,

            // --- MONITORING ---
            instance_var: 'INSTANCE_ID',
            merge_logs: true,
            update_env: true,

            // --- GRACEFUL SHUTDOWN ---
            wait_ready: true,
            kill_timeout: 10000,
        },
    ],

    // --- CLUSTER MODE (optional, for future scaling) ---
    cluster: {
        // When ready to scale, duplicate the app config and set exec_mode: 'cluster'
        // instances: 'max' (uses all CPU cores)
        // exec_mode: 'cluster'
    },

    // --- DEPLOYMENT TARGETS ---
    deploy: {
        local: {
            user: 'kreligar3vad',
            host: 'localhost',
            ref: 'origin/feature/qa-compliance-and-resolver',
            repo: 'file:///Users/kreligar3vad/Documents/Workspace/apps/engine BRAINET',
            path: '/Users/kreligar3vad/Documents/Workspace/apps/engine BRAINET',
            'post-deploy': 'npm install && npm run build',
        },
        alienware: {
            user: 'root',
            host: '100.66.114.87',
            ref: 'origin/feature/qa-compliance-and-resolver',
            repo: 'https://github.com/your-org/brainet.git',
            path: '/home/brainet',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
        },
        production: {
            user: 'deploy',
            host: 'your-production-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:your-org/brainet.git',
            path: '/var/www/brainet',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
        },
    },
}
