import React from 'react'
import { useLocation, Navigate } from 'react-router-dom'

import Auth from './Auth'

const Protected = ({ children, requiredRole }) => {
    const location = useLocation()

    const permitted = requiredRole ? Auth.hasRole(requiredRole) : Auth.isAuthenticated()

    if (permitted) {
        return children
    } else {
        return <Navigate to="/login" state={{ from: location, replace: true }} />
    }
}

export default Protected
