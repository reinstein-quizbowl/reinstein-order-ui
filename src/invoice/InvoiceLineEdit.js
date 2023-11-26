import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel, InputAdornment, TextField } from '@mui/material'

import Api from '../api/Api'

const ITEM_TYPE_OPTIONS = [
    'Conference packet',
    'Non-conference game packet',
    'Practice packet',
    'Practice packet discount',
    'Practice State Series',
    'Practice compilation',
]

const InvoiceLineEdit = (props) => {
    const { line, bookingCreationId, open, onClose, onSubmit } = props

    const [itemType, setItemType] = useState(line ? line.itemType : '')
    const [itemId, setItemId] = useState(line ? line.itemId : '')
    const [label, setLabel] = useState(line ? line.label : '')
    const [quantity, setQuantity] = useState(line ? line.quantity : 1)
    const [unitCost, setUnitCost] = useState(line ? Number(line.unitCost).toFixed(2) : '')

    const [showError, setShowError] = useState(false)
    const determineError = () => {
        if (!itemType) return 'Enter the item type.'

        if (itemId) { // optional, but must be a number if set
            if (isNaN(itemId)) return 'The item ID must be a number (or blank).'
            const itemIdNumber = Number(itemId)
            if (!Number.isInteger(itemIdNumber)) return 'The item ID must be an integer (or blank).'
        }

        if (!label) return 'Enter a label.'

        if (!quantity) return 'Enter the quantity.'
        if (isNaN(quantity)) return 'The quantity must be a number.'
        const quantityNumber = Number(quantity)
        if (!Number.isInteger(quantityNumber) || quantityNumber < 1) return 'The quantity must be a positive integer.'

        if (!unitCost) return 'Enter the unit cost.'
        if (isNaN(unitCost)) return 'The unit cost must be a number.'
    }
    const error = determineError()

    const handleSubmit = async () => {
        if (error) {
            setShowError(true)
        } else {
            const body = {
                itemType,
                itemId,
                label,
                quantity,
                unitCost,
            }
            if (line) {
                await Api.patch(`/bookings/${bookingCreationId}/invoice/${line.id}`, body)
            } else {
                await Api.post(`/bookings/${bookingCreationId}/invoice`, body)
            }

            if (onSubmit) {
                onSubmit()
            }
            onClose()
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
        >
            <form>
                <DialogTitle>{line ? 'Edit Invoice Line' : 'Add Invoice Line'}</DialogTitle>
                <DialogContent>
                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="setItemTypeLabel" htmlFor="setItemType" required>
                                Item type
                            </FormLabel>
                            <Autocomplete
                                aria-labelledby="setItemTypeLabel"
                                id="setItemType"
                                name="setItemType"
                                freeSolo
                                options={ITEM_TYPE_OPTIONS}
                                required
                                value={itemType || ''}
                                renderInput={(params) => <TextField {...params} onChange={e => setItemType(e.target.value)} />}
                                fullWidth
                            />
                        </FormControl>
                    </div>

                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="setItemIdLabel" htmlFor="setItemId">
                                Item ID
                            </FormLabel>
                            <TextField
                                aria-labelledby="setItemIdLabel"
                                id="setItemId"
                                name="setItemId"
                                value={itemId || ''}
                                onChange={e => setItemId(e.target.value)}
                                inputProps={{ className: 'input', type: 'number' }}
                                fullWidth
                            />
                        </FormControl>
                    </div>
                    
                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="setLabelLabel" htmlFor="setLabel" required>
                                Label
                            </FormLabel>
                            <TextField
                                aria-labelledby="setLabelLabel"
                                id="setLabel"
                                name="setLabel"
                                required
                                value={label || ''}
                                onChange={e => setLabel(e.target.value)}
                                inputProps={{ className: 'input' }}
                                fullWidth
                            />
                        </FormControl>
                    </div>
                    
                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="setQuantityLabel" htmlFor="setQuantity" required>
                                Quantity
                            </FormLabel>
                            <TextField
                                aria-labelledby="setQuantityLabel"
                                id="setQuantity"
                                name="setQuantity"
                                value={quantity || ''}
                                required
                                onChange={e => setQuantity(e.target.value)}
                                inputProps={{ className: 'input', type: 'number', min: 1 }}
                                fullWidth
                            />
                        </FormControl>
                    </div>
                    
                    <div className="input-widget-container">
                        <FormControl fullWidth>
                            <FormLabel id="setUnitCostLabel" htmlFor="setUnitCost" required>
                                Unit cost
                            </FormLabel>
                            <TextField
                                aria-labelledby="setUnitCostLabel"
                                id="setUnitCost"
                                name="setUnitCost"
                                value={unitCost || ''}
                                required
                                onChange={e => setUnitCost(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                inputProps={{ className: 'input', type: 'number', step: 0.01 }}
                                fullWidth
                            />
                        </FormControl>
                    </div>

                    {showError && <p className="form-error">{error}</p>}
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={showError && !!error}
                    >
                        Save
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

InvoiceLineEdit.propTypes = {
    line: PropTypes.object, // ApiInvoiceLine; null means this is to create one rather than editing an existing one
    bookingCreationId: PropTypes.string.isRequired,
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired, // () => ?
    onSubmit: PropTypes.func, // () => ?
}

export default InvoiceLineEdit
