import Auth from '../auth/Auth'

const VALID_POST_RESPONSES = [200, 201, 202]

export default class Api {
    static _getAuthHeader = () => {
        const user = Auth.getUser()
        if (user) {
            return { Authorization: `Bearer ${user.token}` }
        } else {
            return {}
        }
    }

    static get = async (path, onError) => {
        try {
            const response = await fetch(process.env.REACT_APP_API_BASE + path, {
                method: 'GET',
                headers: this._getAuthHeader(),
            })

            if (response.status === 200) {
                const json = await response.json()
                return json
            } else {
                const json = await response.json()
                console.error(`Error response when getting ${path}`, { response, json })
                if (onError) {
                    onError(`Couldn't get from ${path}: ${response.status}`)
                } else {
                    throw new Error(`Couldn't get from ${path}: ${response.status}`)
                }
            }
        } catch (e) {
            if (onError) {
                onError(`Couldn't get from ${path}: ${e}`)
            } else {
                throw e
            }
        }
    }

    static post = async (path, body, onError) => {
        try {
            const response = await fetch(process.env.REACT_APP_API_BASE + path, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: { 'Content-type': 'application/json', ...this._getAuthHeader() },
                body: JSON.stringify(body),
            })

            if (VALID_POST_RESPONSES.includes(response.status)) {
                const json = await response.json()
                return json
            } else {
                const json = await response.json()
                console.error(`Error response when posting to ${path}`, { response, json, body })
                if (onError) {
                    onError(`Couldn't post to ${path}: ${response.status}`)
                } else {
                    throw new Error(`Couldn't post to ${path}: ${response.status}`)
                }
            }
        } catch (e) {
            if (onError) {
                onError(`Couldn't post to ${path}: ${e}`)
            } else {
                throw e
            }
        }
    }

    static delete = async (path, onError) => {
        try {
            const response = await fetch(process.env.REACT_APP_API_BASE + path, {
                method: 'DELETE',
                mode: 'cors',
                cache: 'no-cache',
                headers: { 'Content-type': 'application/json', ...this._getAuthHeader() },
            })

            if (response.status === 204) {
                return null
            } else {
                const json = await response.json()
                console.error(`Error response when deleting ${path}`, { response, json })
                if (onError) {
                    onError(`Couldn't delete ${path}: ${response.status}`)
                } else {
                    throw new Error(`Couldn't delete ${path}: ${response.status}`)
                }
            }
        } catch (e) {
            if (onError) {
                onError(`Couldn't delete ${path}: ${e}`)
            } else {
                throw e
            }
        }
    }
}
