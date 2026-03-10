/**
 * BRAINET Authentication Middleware
 * Simple JWT-based auth for MVP (single user, no multi-tenancy)
 *
 * AC-1: All endpoints require auth (except /api/health, /api/auth/login)
 * Returns 401 Unauthorized if missing/invalid token
 */

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

/**
 * Middleware: Verify JWT token in Authorization header
 * Usage: app.use(requireAuth)
 */
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' })
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded // Attach user info to request
        next()
    } catch (e) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' })
    }
}

/**
 * Generate JWT token for login
 * @param {Object} payload - Data to encode (e.g., { userId: 'admin', iat: timestamp })
 * @returns {string} JWT token
 */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '24h', // 24-hour expiration
    })
}

/**
 * Verify password and return token
 * @param {string} password - Password to verify
 * @returns {string|null} JWT token if valid, null otherwise
 */
export function authenticate(password) {
    if (password === ADMIN_PASSWORD) {
        return generateToken({
            userId: 'admin',
            role: 'admin',
            iat: Math.floor(Date.now() / 1000),
        })
    }
    return null
}

export default {
    requireAuth,
    generateToken,
    authenticate,
}
