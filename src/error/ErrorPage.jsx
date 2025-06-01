import React from 'react'

import { Button } from '@mui/material'

import Mailto from '../util-components/Mailto'

const ErrorPage = () => (
    <>
        <p>Sorry, something went wrong.</p>
        <p>Please try again. If that still doesn&rsquo;t work, please write to <Mailto /> to let us know what&rsquo;s going on so we can fix it.</p>
        <p><Button onClick={() => window.location.reload()} variant="contained">Try Again</Button></p>
    </>
)

ErrorPage.propTypes = {}

export default ErrorPage
