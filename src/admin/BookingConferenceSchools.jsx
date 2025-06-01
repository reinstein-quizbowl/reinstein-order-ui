import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel, IconButton, Tooltip } from '@mui/material'
import { Close, Edit } from '@mui/icons-material'

import SchoolPicker from '../util-components/SchoolPicker'

const byShortName = (a, b) => a.shortName.localeCompare(b.shortName)

const BookingConferenceSchools = (props) => {
    const { conference, ordererSchool, schoolsById, onSubmit } = props

    const [editing, setEditing] = useState(false)
    const [schoolIds, setSchoolIds] = useState(conference.schoolIds)
    const schoolsSorted = schoolIds.map(id => schoolsById[id]).sort(byShortName)

    const addSchool = (addId) => {
        if (!schoolIds.includes(addId)) {
            setSchoolIds([addId, ...schoolIds])
        }
    }
    const removeSchool = removeId => setSchoolIds(schoolIds.filter(id => id !== removeId))    

    const handleSubmit = () => {
        onSubmit(schoolIds)
        setEditing(false)
    }

    return (
        <div className="display-or-edit-container-outer">
            <div className="display-or-edit-container-inner">
                <FormControl fullWidth>
                    <FormLabel onClick={() => setEditing(true)}>
                        Schools ({schoolIds.length})
                    </FormLabel>

                    {schoolsSorted.length > 0 && (
                        <ul>
                            {schoolsSorted.map(it => <li key={it.id}>{it.shortName} ({it.name}, {it.city}, {it.state})</li>)}
                        </ul>
                    )}

                    <Dialog
                        open={editing}
                        onClose={() => setEditing(false)}
                        fullWidth
                        maxWidth="lg"
                    >
                        <form>
                            <DialogTitle>Edit schools</DialogTitle>
                            <DialogContent>
                                <ul>
                                    {schoolsSorted.map(school => (
                                        <li key={school.id}>
                                            {school.shortName} ({school.name}, {school.city}, {school.state})
                                            <IconButton size="small" onClick={() => removeSchool(school.id)}>
                                                <Close />
                                            </IconButton>
                                        </li>
                                    ))}
                                </ul>
                                
                                <div className="input-widget-container">
                                    <SchoolPicker
                                        id="addSchool"
                                        value={null}
                                        schools={Object.values(schoolsById)}
                                        onChange={addSchool}
                                        label="Add a school…"
                                        showDistanceFrom={ordererSchool}
                                    />
                                </div>
                            </DialogContent>
                            <DialogActions>
                                <Button variant="outlined" onClick={() => setEditing(false)}>Cancel</Button>
                                <Button variant="contained" onClick={handleSubmit}>
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

BookingConferenceSchools.propTypes = {
    conference: PropTypes.object.isRequired, // ApiConference
    ordererSchool: PropTypes.object.isRequired, // ApiSchool
    schoolsById: PropTypes.object.isRequired, // Map<Number, ApiSchool>
    onSubmit: PropTypes.func.isRequired, // assignedPackets: Array<ApiPacket> => ?
}

export default BookingConferenceSchools
