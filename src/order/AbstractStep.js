import React from 'react'

import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { CheckCircle, RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material'

export default class AbstractStep extends React.PureComponent {
    getStepNumber = () => {
        console.warn('Must override getStepNumber() in ' + this.constructor.name)
        return -1
    }

    getTitle = () => {
        console.warn('Must override getTitle()')
        return 'Order Questions'
    }

    renderBody = () => {
        console.warn('Must override renderBody()')
        return null
    }

    goToNextStep = () => this.props.onGoToStep(this.getStepNumber() + 1)

    wasExpanded = props => props.currentStep === this.getStepNumber()

    isExpanded = () => this.wasExpanded(this.props)

    render() {
        const { highestSeenStep, onToggleExpansion } = this.props

        const expanded = this.isExpanded()

        let icon
        if (expanded) {
            icon = <RadioButtonChecked />
        } else if (highestSeenStep >= this.getStepNumber()) {
            icon = <CheckCircle color="success" />
        } else {
            icon = <RadioButtonUnchecked />
        }

        return (
            <Accordion expanded={expanded} onChange={onToggleExpansion}>
                <AccordionSummary classes={{ content: 'booking-step-header' }}>
                    {icon}
                    <span style={{ width: '0.5rem' }} />
                    <Typography variant="h2">{this.getTitle()}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {this.renderBody()}
                </AccordionDetails>
            </Accordion>
        )
    }
}
