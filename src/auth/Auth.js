import dayJs from 'dayjs'

import Api from '../api/Api'

const LOCAL_STORAGE_KEY = 'user'


const _removeFromStorage = () => localStorage.removeItem(LOCAL_STORAGE_KEY)

const _isExpired = (user) => {
    const { tokenExpires: tokenExpiresStr } = user
    if (!tokenExpiresStr) {
        // This shouldn't happen, but if it does, we can't use the token, so it might as well be expired
        return true
    }

    const tokenExpires = dayJs(tokenExpiresStr)
    const now = dayJs()
    return tokenExpires.isBefore(now)
}

const Auth = {
    // returns true for success, false for failure
    logIn: async (username, password) => {
        const handleError = e => { throw new Error(e) }

        try {
            const response = await Api.post('/auth/login', { username, password }, handleError)
            if (response.token) {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(response))
                return true
            } else {
                return false
            }
        } catch (e) {
            return false
        }
    },

    logOut: () => _removeFromStorage(),

    getUser: () => {
        const userRaw = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (userRaw) {
            const user = JSON.parse(userRaw)
            if (_isExpired(user)) {
                _removeFromStorage()
            } else {
                return user
            }
        }

        return null
    },

    isAuthenticated: () => !!Auth.getUser(),

    getRoles: () => {
        const user = Auth.getUser()
        if (user) {
            return user.roles
        } else {
            return []
        }
    },

    hasRole: role => Auth.getRoles().includes(role),
}

export default Auth
