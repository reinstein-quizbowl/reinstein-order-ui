import dayJs from 'dayjs'

import Api from '../api/Api'

const LOCAL_STORAGE_KEY = 'user'

export default class Auth {
    static _removeFromStorage = () => localStorage.removeItem(LOCAL_STORAGE_KEY)

    static _isExpired = (user) => {
        const { tokenExpires: tokenExpiresStr } = user
        if (!tokenExpiresStr) {
            // This shouldn't happen, but if it does, we can't use the token, so it might as well be expired
            return true
        }

        const tokenExpires = dayJs(tokenExpiresStr)
        const now = dayJs()
        return tokenExpires.isBefore(now)
    }

    // returns true for success, false for failure
    static logIn = async (username, password) => {
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
    }

    static logOut = () => this._removeFromStorage()

    static getUser = () => {
        const userRaw = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (userRaw) {
            const user = JSON.parse(userRaw)
            if (this._isExpired(user)) {
                this._removeFromStorage()
            } else {
                return user
            }
        }

        return null
    }

    static isAuthenticated = () => !!this.getUser()

    static getRoles = () => {
        const user = this.getUser()
        if (user) {
            return user.roles
        } else {
            return []
        }
    }

    static hasRole = role => this.getRoles().includes(role)
}
