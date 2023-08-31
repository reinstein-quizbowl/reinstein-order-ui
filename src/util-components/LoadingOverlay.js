import React from 'react'

import Loading from './Loading'

const LoadingOverlay = () => (
    <div className="busy-overlay">
        <div className="busy-overlay-inner">
            <Loading />
        </div>
    </div>
)

export default LoadingOverlay
