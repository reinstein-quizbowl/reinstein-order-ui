const VALID_POST_RESPONSES = [200, 201, 202]

export default class Api {
    static get = async (path, onError) => {
        try {
            const response = await fetch(process.env.REACT_APP_API_BASE + path)

            if (response.status === 200) {
                const json = await response.json()
                return json
            } else {
                const json = await response.json()
                console.error(`Error response when getting ${path}`, { response, json })
                if (onError) {
                    onError(`Couldn't get from ${path}: ${response.status}`)
                }
            }
        } catch (e) {
            onError(`Couldn't get from ${path}: ${e}`)
        }
    }

    static post = async (path, body, onError) => {
        try {
            const response = await fetch(process.env.REACT_APP_API_BASE + path, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: { 'Content-type': 'application/json' },
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
                }
            }
        } catch (e) {
            onError(`Couldn't post to ${path}: ${e}`)
        }
    }

    static delete = async (path, onError) => {
        try {
            const response = await fetch(process.env.REACT_APP_API_BASE + path, {
                method: 'DELETE',
                mode: 'cors',
                cache: 'no-cache',
                headers: { 'Content-type': 'application/json' },
            })

            if (response.status === 204) {
                return null
            } else {
                const json = await response.json()
                console.error(`Error response when deleting ${path}`, { response, json })
                if (onError) {
                    onError(`Couldn't delete ${path}: ${response.status}`)
                }
            }
        } catch (e) {
            onError(`Couldn't delete ${path}: ${e}`)
        }
    }
}
