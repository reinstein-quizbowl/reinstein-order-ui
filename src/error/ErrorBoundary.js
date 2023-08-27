import React from 'react'

import ErrorPage from './ErrorPage'

export default class ErrorBoundary extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            error: null,
        }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        // TODO log?
        console.error('Received error', { error, info })
    }

    render() {
        const { children } = this.props
        const { error } = this.state

        if (error) {
            return <ErrorPage />
        } else {
            return children
        }
    }
}
