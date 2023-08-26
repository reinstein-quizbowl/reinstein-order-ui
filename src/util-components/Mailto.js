const address = process.env.REACT_APP_CONTACT_EMAIL

const Mailto = () => (<a href={`mailto:${address}`}>{address}</a>)

export default Mailto
