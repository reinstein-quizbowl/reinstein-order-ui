import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button, FormControl, FormLabel, TextField } from '@mui/material'

import Auth from './Auth'
import LoadingOverlay from '../util-components/LoadingOverlay'

const Login = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [busy, setBusy] = useState(false)
    const [showError, setShowError] = useState(false)
    const [error, setError] = useState(null)

    const handleUsernameChange = e => setUsername(e.target.value)
    const handlePasswordChange = e => setPassword(e.target.value)

    const determineError = () => {
        if (!username) return 'Please enter your username.'
        if (!password) return 'Please enter your password.'

        return null
    }

    const handleLogin = async e => {
        e.preventDefault()
        setError('')
        setBusy(true)

        if (determineError()) {
            setShowError(true)
            return
        }

        const success = await Auth.login(username, password)
        setBusy(false)
        if (success) {
            const destination = location && location.state && location.state.from && location.state.from.pathname ? location.state.from.pathname : '/admin'
            navigate(destination, { replace: true })
        } else {
            setError('Invalid credentials.')
            setShowError(true)
        }
    }

    return (
        <form onSubmit={handleLogin}>
            {busy && <LoadingOverlay />}

            <div className="input-widget-container">
                <FormControl fullWidth>
                    <FormLabel id="usernameLabel" htmlFor="username" required>
                        Username:
                    </FormLabel>
                    <TextField
                        aria-labelledby="usernameLabel"
                        id="username"
                        name="username"
                        value={username}
                        onChange={handleUsernameChange}
                        inputProps={{ className: 'input' }}
                        required
                        fullWidth
                        autoFocus
                    />
                </FormControl>
            </div>

            <div className="input-widget-container">
                <FormControl fullWidth>
                    <FormLabel id="passwordLabel" htmlFor="password" required>
                        Password:
                    </FormLabel>
                    <TextField
                        aria-labelledby="passwordLabel"
                        id="password"
                        name="password"
                        value={password}
                        onChange={handlePasswordChange}
                        inputProps={{ className: 'input', type: 'password' }}
                        required
                        fullWidth
                    />
                </FormControl>
            </div>

            {showError && <p className="form-error">{error}</p>}

            <p className="form-submit-container">
                <Button type="submit" variant="contained">
                    Log In
                </Button>
            </p>
        </form>
    )
}

export default Login
