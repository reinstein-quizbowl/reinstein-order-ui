import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel, MenuItem, Select } from '@mui/material'

import { byYearCodeAndNumber } from '../util/util'


const NonConferenceGamePacket = (props) => {
    const { gameId, packetsById, onCancel, onSubmit } = props

    const [packetId, setPacketId] = useState(null)
    const [showError, setShowError] = useState(false)

    const determineError = () => {
        if (!packetId) return 'Choose a packet.'
    }
    const error = determineError()

    const handleSubmit = () => {
        if (error) {
            setShowError(true)
        } else {
            onSubmit(gameId, packetId)
        }
    }

    return (
        <Dialog
            open={!!gameId}
            onClose={onCancel}
            fullWidth
            maxWidth="lg"
        >
            <form>
                <DialogTitle>Assign packet</DialogTitle>
                <DialogContent>
                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="setPacketLabel" htmlFor="setPacketId" required>
                                Choose the packet:
                            </FormLabel>
                            <Select
                                aria-labelledby="setPacketLabel"
                                id="setPacketId"
                                name="setPacketId"
                                value={packetId || ''}
                                onChange={e => setPacketId(e.target.value)}
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

                    {showError && <p className="form-error">{error}</p>}
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={onCancel}>Cancel</Button>
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
    )
}

NonConferenceGamePacket.propTypes = {
    gameId: PropTypes.number, // if falsy, not active
    packetsById: PropTypes.object.isRequired, // Map<Number, ApiPacket>
    onCancel: PropTypes.func.isRequired, // () => ?
    onSubmit: PropTypes.func.isRequired, // (gameId: Number, assignedPacketId: Number) => ?
}

export default NonConferenceGamePacket
