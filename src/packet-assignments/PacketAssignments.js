import React from 'react'
import { useErrorBoundary } from 'react-error-boundary'

import { Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material'
import { CheckCircle } from '@mui/icons-material'

import Api from '../api/Api'
import { groupById } from '../util/util'
import Loading from '../util-components/Loading'

const byNumber = (a, b) => a.number - b.number
const byShortName = (a, b) => a.shortName.localeCompare(b.shortName)

const PacketAssignments = (props) => {
    const { showBoundary: handleError } = useErrorBoundary()

    return <PacketAssignmentsImpl onError={handleError} {...props} />
}

export default PacketAssignments

class PacketAssignmentsImpl extends React.PureComponent {
	constructor(props) {
		super(props)

		this.state = {
			schoolsById: null,
			year: null,
			packets: null,
			exposuresByExposedSchoolId: null,
		}
	}

	componentDidMount() {
    	document.title = 'Packet Assignments \u2013 Reinstein QuizBowl'

		this.loadSchools()
		this.loadExposures()
	}

    loadSchools = async () => {
        const { onError } = this.props

        if (this.state.schoolsById) return

        const schools = await Api.get('/schools', onError)
        this.setState({ schoolsById: groupById(schools) })
    }

	loadExposures = async () => {
		const { onError } = this.props

		const year = await Api.get('/years/current', onError)
		this.setState({ year })

		const [packets, exposures] = await Promise.all([
			Api.get(`/packets?yearCode=${year.code}`),
			Api.get(`/packetExposures?yearCode=${year.code}`),
		])

		const exposuresByExposedSchoolId = {}
		for (const exposure of exposures) {
			if (!exposuresByExposedSchoolId[exposure.exposedSchoolId]) {
				exposuresByExposedSchoolId[exposure.exposedSchoolId] = []
			}

			exposuresByExposedSchoolId[exposure.exposedSchoolId].push(exposure)
		}

		this.setState({ packets: packets.sort(byNumber), exposuresByExposedSchoolId })
	}

	renderSchoolRow = (school) => {
		const { packets, exposuresByExposedSchoolId } = this.state

		const exposures = exposuresByExposedSchoolId[school.id] || []

		return (
			<TableRow key={school.id}>
				<TableCell component="th" variant="head">
					<Tooltip title={`${school.name} (${school.city}, ${school.state})`}>
						<span>{school.shortName}</span>
					</Tooltip>
				</TableCell>
				{packets.map(packet => this.renderCell(school, packet, exposures.find(it => it.packetId === packet.id)))}
			</TableRow>
		)
	}

	renderCell = (school, packet, exposure) => {
		const { schoolsById } = this.state

		const key = `school${school.id}-packet${packet.id}`

		if (exposure) {
			return (
				<TableCell key={key} align="center">
					<Tooltip title={`${exposure.source} (${exposure.tentativePacketExposure ? 'tentative ' : ''}order placed by ${schoolsById[exposure.ordererSchoolId].shortName})`}>
						<CheckCircle color="success" />
					</Tooltip>
				</TableCell>
			)
		} else {
			return <TableCell key={key} />
		}
	}

	render() {
		const { schoolsById, year, packets, exposuresByExposedSchoolId } = this.state

		if (!schoolsById || !year || !packets || !exposuresByExposedSchoolId) return <Loading />

		const yearName = year.name.replace('-', '–')

		if (Object.keys(exposuresByExposedSchoolId).length === 0) {
			return <p>No schools are signed up to hear our questions in the {yearName} regular season so far.</p>
		}

		const schools = Object.values(schoolsById)
			.filter(school => !!exposuresByExposedSchoolId[school.id])
			.sort(byShortName)

		const schoolWidth = 0.2
		const packetWidth = (1.0 - schoolWidth) / packets.length
		const schoolWidthPct = (100 * schoolWidth) + '%'
		const packetWidthPct = (100 * packetWidth) + '%'

		return (
			<>
				<p>This table shows which schools are signed up to hear which packets in {yearName}. Hover over a cell for more details.</p>

				<Table className="invoice">
					<caption style={{ captionSide: 'bottom' }}>
						If a school is not listed, it&rsquo;s not currently registered to hear any of our questions in the regular season.
					</caption>
					<TableHead>
						<TableRow>
							<TableCell style={{ width: schoolWidthPct }}>Packet #</TableCell>
							{packets.map(packet => (
								<TableCell key={packet.id} align="center" style={{ width: packetWidthPct }}>
									{packet.number}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{schools.map(this.renderSchoolRow)}
					</TableBody>
				</Table>
			</>
		)
	}
}
