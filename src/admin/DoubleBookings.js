import React from 'react'
import { Link } from 'react-router-dom'
import { useErrorBoundary } from 'react-error-boundary'

import { Alert } from '@mui/material'

import Api from '../api/Api'
import { groupById } from '../util/util'

// The sorting doesn't really matter that much, except that we want to keep schools and packets together
const comparator = (a, b) => {
    if (a.schoolId === b.schoolId) {
        return a.packetId - b.packetId
    } else {
        return a.schoolId - b.schoolId
    }
}

const DoubleBookings = (props) => {
    const { showBoundary: handleError } = useErrorBoundary()

    return <DoubleBookingsImpl onError={handleError} {...props} />
}

export default DoubleBookings

class DoubleBookingsImpl extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            packetsById: null,
            schoolsById: null,
            exposures: null,
        }
    }

    componentDidMount() {
        this.loadPackets()
        this.loadSchools()
        this.loadExposures()
    }

    loadPackets = async () => {
        const { onError } = this.props

        const packets = await Api.get('/packets', onError)
        this.setState({ packetsById: groupById(packets) })
    }

    loadSchools = async () => {
        const { onError } = this.props

        const schools = await Api.get('/schools', onError)
        this.setState({ schoolsById: groupById(schools) })
    }

	loadExposures = async () => {
		const { onError } = this.props

		const exposures = await Api.get('/packetExposures/doubleBookings', onError)
		this.setState({ exposures: exposures.sort(comparator) })
	}

    renderExposure = (exposure) => {
        const { packetsById, schoolsById } = this.state

        const exposedSchool = schoolsById[exposure.exposedSchoolId]
        const packet = packetsById[exposure.packetId]
        const ordererSchool = schoolsById[exposure.ordererSchoolId]

        return (
            <li key={`${exposedSchool.id}-${packet.id}-${exposure.sourceId}`}>
                {exposedSchool.shortName} is booked to hear {packet.yearCode} packet {packet.number} at {exposure.source} (ID {exposure.sourceId}){' '}
                <Link to={`/admin/order/${exposure.bookingCreationId}`}>(order placed by {ordererSchool.shortName})</Link>
            </li>
        )
    }

    render() {
        const { packetsById, schoolsById, exposures } = this.state

        if (!packetsById || !schoolsById || !exposures || exposures.length === 0) return null

        return (
            <Alert severity="error">
                <h2>Double-Bookings</h2>
                
                <ul>
                    {exposures.map(this.renderExposure)}
                </ul>
            </Alert>
        )
    }
}
