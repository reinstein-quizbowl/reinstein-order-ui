import React from 'react'

import { useRouteError } from 'react-router-dom'

import ErrorPage from './ErrorPage'

function RouterErrorBoundary() {
    const error = useRouteError()

    console.error('Received error', error)

    return <ErrorPage />
}

export default RouterErrorBoundary
