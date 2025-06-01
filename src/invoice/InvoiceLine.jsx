import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, TableCell, TableRow } from '@mui/material'
import { MoreVert } from '@mui/icons-material'

import InvoiceLineEdit from './InvoiceLineEdit'
import Api from '../api/Api'
import { formatMoney } from '../util/util'

const InvoiceLine = ({ line, bookingCreationId, allowEditing, onChange }) => {
    const [menuAnchorElt, setMenuAnchorElt] = useState(null)
    const openMenu = e => setMenuAnchorElt(e.currentTarget)
    const closeMenu = () => setMenuAnchorElt(null)

    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const startConfirmingDelete = () => {
        setConfirmingDelete(true)
        closeMenu()
    }
    const closeConfirmingDelete = () => {
        setConfirmingDelete(false)
        closeMenu()
    }
    const handleDelete = async () => {
        await Api.delete(`/bookings/${bookingCreationId}/invoice/${line.id}`)
        closeConfirmingDelete()
        if (onChange) {
            onChange()
        }
    }

    const [editing, setEditing] = useState(false)
    const startEditing = () => {
        setEditing(true)
        closeMenu()
    }
    const closeEditing = () => {
        setEditing(false)
        closeMenu()
    }

    return (
        <TableRow>
            <TableCell variant="head" component="th">
                {line.label}
                {Number(line.quantity) > 1 && ` (${line.quantity} @ ${formatMoney(line.unitCost)} each)`}
            </TableCell>
            <TableCell align="right">{formatMoney(Number(line.quantity) * Number(line.unitCost), true)}</TableCell>
            {allowEditing && (
                <TableCell>
                    <IconButton  size="small" onClick={openMenu}>
                        <MoreVert />
                    </IconButton>

                    <Menu anchorEl={menuAnchorElt} open={!!menuAnchorElt} onClose={closeMenu}>
                        <MenuItem onClick={startEditing}>
                            Edit line
                        </MenuItem>
                        <MenuItem onClick={startConfirmingDelete}>
                            Delete line
                        </MenuItem>
                    </Menu>

                    <InvoiceLineEdit
                        line={line}
                        bookingCreationId={bookingCreationId}
                        open={editing}
                        onClose={closeEditing}
                        onSubmit={onChange}
                    />

                    <Dialog open={confirmingDelete} onClose={closeConfirmingDelete}>
                        <DialogTitle>Delete line item</DialogTitle>
                        <DialogContent>
                            <p>Are you sure you want to delete this line on the invoice?</p>
                            <p>This cannot directly be undone. You could manually reconstruct the invoice or use the automatic recalculator (which would destroy any other manual changes you may have made).</p>
                        </DialogContent>
                        <DialogActions>
                            <Button variant="outlined" onClick={closeConfirmingDelete}>Never mind</Button>
                            <Button
                                variant="contained"
                                onClick={handleDelete}
                                color="warning"
                            >
                                Yes, delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                </TableCell>
            )}
        </TableRow>
    )
}

InvoiceLine.propTypes = {
    line: PropTypes.object.isRequired, // ApiInvoiceLine
    bookingCreationId: PropTypes.string.isRequired,
    allowEditing: PropTypes.bool,
    onChange: PropTypes.func,
}

export default InvoiceLine
