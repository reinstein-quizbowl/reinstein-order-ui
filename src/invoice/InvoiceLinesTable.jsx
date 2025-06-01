import React from 'react'
import PropTypes from 'prop-types'

import { Table, TableBody, TableCell, TableFooter, TableHead, TableRow } from '@mui/material'

import InvoiceLine from './InvoiceLine'
import { formatMoney } from '../util/util'
import Loading from '../util-components/Loading'

const calculateTotal = (lines) => {
    // There's some clever way to do this with a reduce function, but I find it hard to read
    let total = 0.00
    for (const line of lines) {
        total += Number(line.quantity) * Number(line.unitCost)
    }

    return total
}

const InvoiceLinesTable = ({ lines, bookingCreationId, allowEditing, onChange }) => {
    if (!lines) {
        return <Loading />
    } else if (lines.length === 0) {
        return <p>You have not ordered anything.</p>
    } else {
        return (
            <Table className="invoice">
                <TableHead>
                    <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Price</TableCell>
                        {allowEditing && <TableCell>Action</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {lines.map(line => (
                        <InvoiceLine
                            key={line.id || line.label /* line.id is null for the synthetic items used in previewing */}
                            line={line}
                            bookingCreationId={bookingCreationId}
                            allowEditing={allowEditing}
                            onChange={onChange}
                        />
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell variant="head" component="th">Total</TableCell>
                        <TableCell align="right">{formatMoney(calculateTotal(lines), true)}</TableCell>
                        {allowEditing && <TableCell />}
                    </TableRow>
                </TableFooter>
            </Table>
        )
    }
}

InvoiceLinesTable.propTypes = {
    lines: PropTypes.array, // Array<ApiInvoiceLine>. required to actually render anything meaningful
    bookingCreationId: PropTypes.string.isRequired,
    allowEditing: PropTypes.bool,
    onChange: PropTypes.func,
}

export default InvoiceLinesTable