import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import { TableCell, TableRow, Tooltip } from '@mui/material'

import { getStatusLabel } from '../util/bookingUtil'
import { formatMoney, makeEnglishList } from '../util/util'

const renderConference = (conference, schoolsById) => {
    if (conference) {
        return (
            <Tooltip title={(
                <div>
                    <p>
                        {conference.schoolIds.length} schools:{' '}
                        {makeEnglishList(conference.schoolIds.map(id => schoolsById[id].shortName))}
                    </p>
                    <p>
                        {conference.assignedPackets.length} packets:{' '}
                        {conference.assignedPackets.length === 0 ? 'TBD' : makeEnglishList(conference.assignedPackets.map(it => it.number))}
                    </p>
                </div>
            )}>
                <span>{conference.name}</span>
            </Tooltip>
        )
    } else {
        return 'None'
    }
}

const renderNonConferenceGames = (nonConferenceGames, schoolsById) => {
    if (nonConferenceGames && nonConferenceGames.length > 0) {
        return (
            <Tooltip title={(
                <ul>
                    {nonConferenceGames.map(game => (
                        <li key={game.id}>
                            Packet {game.assignedPacket ? game.assignedPacket.number : 'TBD'}:{' '}
                            {makeEnglishList(game.schoolIds.map(id => schoolsById[id].shortName))}
                        </li>
                    ))}
                </ul>
            )}>
                <span>{nonConferenceGames.length}</span>
            </Tooltip>
        )
    } else {
        return 'None'
    }
}

const renderPractice = (stateSeries, packets, compilations) => {
    const itemCount = stateSeries.length + packets.length + compilations.length
    if (itemCount === 0) {
        return 'None'
    } else {
        return (
            <Tooltip title={(
                <ul>
                    {stateSeries.map(ss => <li key={`ss-${ss.id}`}>{ss.stateSeries.name}</li>)}
                    {packets.map(p => <li key={`p-${p.id}`}>{p.packet.name}</li>)}
                    {compilations.map(c => <li key={`c-${c.id}`}>{c.compilation.name}</li>)}
                </ul>
            )}>
                <span>{itemCount === 1 ? '1 item' : itemCount + ' items'}</span>
            </Tooltip>
        )
    }
}

const renderNotes = (internal, external) => {
    if (!internal && !external) {
        return '\u00a0' // non-breaking space
    } else {
        return (
            <Tooltip title={(
                <div>
                    {internal && <p><b>Internal:</b> {internal}</p>}
                    {external && <p><b>From customer:</b> {external}</p>}
                </div>
            )}>
                <span>Hover to see</span>
            </Tooltip>
        )
    }
}

const BookingSummaryRow = ({ booking, schoolsById }) => {
    const navigate = useNavigate()

    const bookingPageUrl = `/admin/order/${booking.creationId}`

    return (
        <TableRow className="booking-summary-row" hover onClick={() => navigate(bookingPageUrl)} onAuxClick={() => window.open(bookingPageUrl)}>
            <TableCell variant="head">
                {dayjs(booking.createdAt).format('M/D/YY')}
            </TableCell>
            <TableCell>
                <Tooltip title={`${booking.school.name} (${booking.school.city}, ${booking.school.state})`}>
                    <span>{booking.school.shortName}</span>
                </Tooltip>
            </TableCell>
            <TableCell>
                <Tooltip title={`${booking.emailAddress} (${booking.authority})`}>
                    <span>{booking.name}</span>
                </Tooltip>
            </TableCell>
            <TableCell>
                {renderConference(booking.conference, schoolsById)}
            </TableCell>
            <TableCell>
                {renderNonConferenceGames(booking.nonConferenceGames, schoolsById)}
            </TableCell>
            <TableCell>
                {renderPractice(booking.stateSeriesOrders, booking.packetOrders, booking.compilationOrders)}
            </TableCell>
            <TableCell>
                {renderNotes(booking.internalNote, booking.externalNote)}
            </TableCell>
            <TableCell align="right">
                {formatMoney(booking.cost, true)}
            </TableCell>
            <TableCell>
                {getStatusLabel(booking.statusCode)}
            </TableCell>
        </TableRow>
    )
}

BookingSummaryRow.propTypes = {
    booking: PropTypes.object.isRequired, // ApiBooking
    schoolsById: PropTypes.object.isRequired, // Map<Long, ApiSchool>
}

export default BookingSummaryRow
