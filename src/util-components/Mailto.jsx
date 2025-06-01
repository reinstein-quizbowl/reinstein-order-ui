import React from 'react'

const address = import.meta.env.VITE_APP_CONTACT_EMAIL

const Mailto = () => (<a href={`mailto:${address}`}>{address}</a>)

Mailto.propTypes = {}

export default Mailto
