import React from 'react'

import { Table, TableBody, TableCell, TableFooter, TableHead, TableRow } from '@mui/material'

import { formatMoney } from '../util/util'
import Loading from '../util-components/Loading'

export default class Invoice extends React.PureComponent {
    renderLine = line => (
        <TableRow key={line.id}>
            <TableCell component="th">
                {line.label}
                {Number(line.quantity) > 1 && ` (${line.quantity} @ ${formatMoney(line.unitCost)} each)`}
            </TableCell>
            <TableCell align="right">{formatMoney(Number(line.quantity) * Number(line.unitCost), true)}</TableCell>
        </TableRow>
    )

    calculateTotal = (lines) => {
        // There's some clever way to do this with a reduce function, but I find it hard to read
        let total = 0.00
        for (const line of lines) {
            total += Number(line.quantity) * Number(line.unitCost)
        }

        return total
    }

    render() {
        const { lines } = this.props
        
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
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lines.map(this.renderLine)}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell component="th">Total</TableCell>
                            <TableCell align="right">{formatMoney(this.calculateTotal(lines), true)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            )
        }
    }
}
