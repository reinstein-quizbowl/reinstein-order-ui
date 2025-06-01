import React from 'react'

import { useRouteError } from 'react-router-dom'

import ErrorPage from './ErrorPage'

const RouterErrorBoundary = () => {
    const error = useRouteError()

    console.error('Received error', error)

    return <ErrorPage />
}

RouterErrorBoundary.propTypes = {}

export default RouterErrorBoundary
