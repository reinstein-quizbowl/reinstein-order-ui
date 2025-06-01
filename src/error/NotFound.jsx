import React from 'react'

import Mailto from '../util-components/Mailto'

const NotFound = () => (
    <>
        <p>We couldn&rsquo;t find what you&rsquo;re looking for.</p>
        <p>If you followed a link to get here, please write to <Mailto /> to let us know what&rsquo;s wrong.</p>
    </>
)

NotFound.propTypes = {}

export default NotFound
