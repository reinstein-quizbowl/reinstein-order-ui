import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel, IconButton, Tooltip } from '@mui/material'
import { Edit } from '@mui/icons-material'

const SimpleDisplayOrEditDialog = (props) => {
    const { id, displayFieldName, displayValue, dialogTitle, editWidget, initialValue, validator, onSubmit } = props

    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(initialValue)
    const [showError, setShowError] = useState(false)

    const idSafe = editWidget.id || id
    const labelId = idSafe + 'Label'
    const editWidgetFull = React.cloneElement(editWidget, {
        id: idSafe,
        value,
        'aria-labelledby': labelId,
        onChange: (val) => {
            // This is a cheap way to deal with the fact that some input widgets send back an event, but others (like the date input widget) just send back a value
            if (val && val.target) {
                setValue(val.target.value)
            } else {
                setValue(val)
            }
        }
    })

    const error = validator ? validator(value) : null

    const handleSubmit = () => {
        if (error) {
            setShowError(true)
        } else {
            onSubmit(value)
            setEditing(false)
        }
    }

    const dialogTitleSafe = dialogTitle || 'Edit ' + displayFieldName

    return (
        <div className="display-or-edit-container-outer">
            <div className="display-or-edit-container-inner">
                <FormControl fullWidth>
                    <FormLabel id={labelId} htmlFor={idSafe} onClick={() => setEditing(true)}>
                        {displayFieldName}
                    </FormLabel>
                    {displayValue}
                    <Dialog
                        open={editing}
                        onClose={() => setEditing(false)}
                        fullWidth
                        maxWidth="lg"
                    >
                        <form>
                            <DialogTitle>{dialogTitleSafe}</DialogTitle>
                            <DialogContent>
                                <div className="input-widget-container">
                                    {editWidgetFull}
                                </div>

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
            <Tooltip title={dialogTitleSafe}>
                <IconButton size="small" onClick={() => setEditing(true)}>
                    <Edit />
                </IconButton>
            </Tooltip>
        </div>
    )
}

SimpleDisplayOrEditDialog.propTypes = {
    id: PropTypes.string.isRequired,
    displayFieldName: PropTypes.node.isRequired,
    displayValue: PropTypes.node.isRequired,
    dialogTitle: PropTypes.node, // also used for the edit button tooltip
    editWidget: PropTypes.node.isRequired, 
    initialValue: PropTypes.any, // an appropriate value for the editWidget
    validator: PropTypes.func, // value => String?
    onSubmit: PropTypes.func.isRequired, // newValue => ?
}

export default SimpleDisplayOrEditDialog
