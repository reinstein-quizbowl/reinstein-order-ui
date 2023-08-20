const VALID_POST_RESPONSES = [200, 201, 202]

export default class Api {
    static get = async (path) => {
        const response = await fetch(process.env.REACT_APP_API_BASE + path)

        if (response.status === 200) {
            const json = await response.json()
            return json
        } else {
            const json = await response.json()
            console.warn(`Error response from ${path}`, { response, json })
            // TODO we probably want to display something
            return null
        }
    }

    static post = async (path, body) => {
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
            console.warn(`Error response from ${path}`, { response, json })
            // TODO we probably want to display something
            return null
        }
    }

    static delete = async (path) => {
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
            console.warn(`Error response from ${path}`, { response, json })
            // TODO we probably want to display something
            return null
        }
    }
}
