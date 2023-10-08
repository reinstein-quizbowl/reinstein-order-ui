import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel, IconButton, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import { Close, Edit } from '@mui/icons-material'

const byYearCodeAndNumber = (a, b) => {
    if (a.yearCode === b.yearCode) {
        return a.number - b.number
    } else {
        // Newer first, effectively. I'm not sure this is ideal for all cases, but for the dropdown it is.
        return b.yearCode.localeCompare(a.yearCode)
    }
}

const BookingConferencePackets = (props) => {
    const { conference, packetsById, onSubmit } = props

    const [editing, setEditing] = useState(false)
    const [packetsRequested, setPacketsRequested] = useState(conference.packetsRequested)
    const [assignedPackets, setAssignedPackets] = useState(conference.assignedPackets.sort(byYearCodeAndNumber)) // always keep the state value sorted
    const [showError, setShowError] = useState(false)

    const addPacket = (addId) => {
        if (assignedPackets.some(it => it.id === addId)) {
            // redundant; ignore
            return
        }
        
        setAssignedPackets([packetsById[addId], ...assignedPackets].sort(byYearCodeAndNumber))
    }
    const removePacket = removeId => setAssignedPackets(assignedPackets.filter(it => it.id !== removeId))

    const determineError = () => {
        if (!packetsRequested || packetsRequested < 1) return 'Enter the number of packets requested.'
    }
    const error = determineError()

    const handleSubmit = () => {
        if (error) {
            setShowError(true)
        } else {
            onSubmit(packetsRequested, assignedPackets)
            setEditing(false)
        }
    }

    return (
        <div className="display-or-edit-container-outer">
            <div className="display-or-edit-container-inner">
                <FormControl fullWidth>
                    <FormLabel onClick={() => setEditing(true)}>
                        Packets ({packetsRequested} requested, {conference.assignedPackets.length} assigned)
                    </FormLabel>

                    {assignedPackets.length > 0 && (
                        <ul className="two-columns">
                            {assignedPackets.map(it => <li key={it.id}>{it.name}</li>)}
                        </ul>
                    )}

                    <Dialog
                        open={editing}
                        onClose={() => setEditing(false)}
                        fullWidth
                        maxWidth="lg"
                    >
                        <form>
                            <DialogTitle>Edit packet assignments</DialogTitle>
                            <DialogContent>
                                <div className="input-widget-container">
                                    <FormControl fullWidth>
                                        <FormLabel id="packetsRequestedLabel" htmlFor="packetsRequested" required>
                                            Packets requested
                                        </FormLabel>
                                        <TextField
                                            aria-labelledby="packetsRequestedLabel"
                                            id="packetsRequested"
                                            name="packetsRequested"
                                            type="number"
                                            value={packetsRequested || ''}
                                            onChange={e => setPacketsRequested(e.target.value)}
                                            inputProps={{ className: 'input', min: 1 }}
                                            required
                                            fullWidth
                                        />
                                    </FormControl>
                                </div>

                                <p>{assignedPackets.length === 1 ? 'This packet is' : `These ${assignedPackets.length} packets are`} assigned:</p>
                                <ul className="two-columns">
                                    {assignedPackets.map(packet => (
                                        <li key={packet.id}>
                                            {packet.name}
                                            <IconButton size="small" onClick={() => removePacket(packet.id)}>
                                                <Close />
                                            </IconButton>
                                        </li>
                                    ))}
                                </ul>
                                
                                <div className="input-widget-container">
                                    <FormControl fullWidth>
                                        <FormLabel id="addPacketLabel" htmlFor="addPacket" required>
                                            Add a packet
                                        </FormLabel>
                                        <Select
                                            aria-labelledby="addPacketLabel"
                                            id="addPacket"
                                            name="addPacket"
                                            value=""
                                            onChange={e => addPacket(e.target.value)}
                                            fullWidth
                                        >
                                            {Object.values(packetsById).sort(byYearCodeAndNumber).map(packet =>
                                                <MenuItem key={packet.id} value={packet.id}>
                                                    {packet.name}
                                                </MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                </div>

                                {assignedPackets.length !== Number(packetsRequested) && (
                                    <p className="form-warning">
                                        {packetsRequested === 1 ? 'One packet was' : packetsRequested + ' packets were'} requested, but{' '}
                                        {assignedPackets.length === 1 ? 'one is' : assignedPackets.length + ' are'} assigned.
                                    </p>
                                )}

                                {showError && <p className="form-error">{error}</p>}
                            </DialogContent>
                            <DialogActions>
                                <Button variant="outlined" onClick={() => setEditing(false)}>Cancel</Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={showError && !!error}
                                >
                                    Continue
                                </Button>
                            </DialogActions>
                        </form>
                    </Dialog>
                </FormControl>
            </div>
            <Tooltip title="Edit packet assignments">
                <IconButton size="small" onClick={() => setEditing(true)}>
                    <Edit />
                </IconButton>
            </Tooltip>
        </div>
    )
}

BookingConferencePackets.propTypes = {
    conference: PropTypes.object.isRequired, // ApiConference
    packetsById: PropTypes.object.isRequired, // Map<Number, ApiPacket>
    onSubmit: PropTypes.func.isRequired, // assignedPackets: Array<ApiPacket> => ?
}

export default BookingConferencePackets
