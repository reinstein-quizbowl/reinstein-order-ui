import React from 'react'

import { Link } from 'react-router-dom'

import { Button } from '@mui/material'

import '../App.css'
import AbstractStep from './AbstractStep'
import Api from '../api/Api'
import { setStatePromise } from '../util/util'
import Mailto from '../util-components/Mailto'

export default class Step4CheckPacketAvailability extends AbstractStep {
    constructor(props) {
        super(props)

        this.state = Object.assign({}, this.state, {
            potentialAssignments: null,
        })
    }

    componentDidMount() {
        if (this.isExpanded()) {
            this.checkAvailability()
        }
    }

    componentDidUpdate(prevProps) {
        if (this.isExpanded() && !this.wasExpanded(prevProps)) {
            this.checkAvailability()
        }
    }

    isBusy = () => this.state.busy || !this.state.potentialAssignments

    getStepNumber = () => 4

    getTitle = () => 'Check Question Availability'

    checkAvailability = async () => {
        const { data, onError } = this.props

        await this.setBusy(true)

        const potentialAssignments = await Api.get(`/bookings/${data.creationId}/potentialPacketAssignments`, onError)
        await setStatePromise(this, { potentialAssignments, busy: false })
    }

    assignPackets = async () => {
        const { data, dataReloader, onError } = this.props
        const { potentialAssignments } = this.state

        if (!potentialAssignments || potentialAssignments.some(it => it.isMissingPacketAssignment)) {
            console.warn('Attempt to assign packets despite errors')
            return
        }

        if (potentialAssignments.length > 0) {
            await this.setBusy(true)

            const updated = await Api.post(`/bookings/${data.creationId}/packetAssignments`, potentialAssignments, onError)
            await dataReloader(updated)
            await this.setBusy(false)
        }

        this.goToNextStep()
    }

    renderSuccessfulAssignment = (assignment) => {
        const { packets } = this.props

        const packet = packets.find(it => it.id === assignment.packetId)
        if (packet) {
            return <li key={assignment.description}>For {assignment.description}: packet {packet.number}</li>
        }
    }

    renderFailedAssignment = assignment => <li key={assignment.description}>We couldn&rsquo;t find a packet to use for {assignment.description}.</li>

    renderBody = () => {
        const { potentialAssignments, busy } = this.state

        if (busy || !potentialAssignments) {
            if (potentialAssignments) {
                return (
                    <>
                        <p>Assigning packets&hellip;</p>
                    </>
                )
            } else {
                return (
                    <>
                        <p>Checking to make sure we have fresh questions available for your order&hellip;</p>
                    </>
                )
            }
        } else if (potentialAssignments.length === 0) {
            return (
                <>
                    <p>Since you&rsquo;re not ordering questions for games between different schools this year, there&rsquo;s no question of whether we have enough packets available for your order.</p>
                    <p>It seems like you must just want to order practice questions. If that&rsquo;s correct, you can just go on to the next step. If that&rsquo;s not correct, go back to the appropriate previous step.</p>
                    <p className="form-submit-container">
                        <Button
                            type="submit"
                            onClick={this.assignPackets}
                            variant="contained"
                        >
                            Continue
                        </Button>
                    </p>
                </>
            )
        } else if (potentialAssignments.some(it => it.isMissingPacketAssignment)) {
            return (
                <div className="form-error">
                    <p>Unfortunately, we weren&rsquo;t able to find enough packets for what you have requested:</p>
                    <ul>
                        {potentialAssignments.filter(it => it.isMissingPacketAssignment).map(this.renderFailedAssignment)}
                    </ul>
                    <p>You may want to go back to earlier steps in the process (by clicking the name of a section) to edit your order to see if we can accommodate a smaller order.</p>
                    <p>You can also <Link to="/packetAssignments" target="_blank">review the list of packets already assigned</Link> and see if you can think of a way to make it work even though our software (which isn&rsquo;t perfect!) couldn&rsquo;t. If so, please write to us at <Mailto />.</p>
                    <p>You can also adjust your order and try again, or write to <Mailto /> for help.</p>
                </div>
            )
        } else {
            return (
                <>
                    <p className="success">Good news: we have enough packets available for your order. Here&rsquo;s how we&rsquo;re planning on assigning them:</p>
                    <ul>
                        {potentialAssignments.map(this.renderSuccessfulAssignment)}
                    </ul>
                    <p>You must be certain to use the packets only as assigned&mdash;don&rsquo;t use a packet in any way other than how it&rsquo;s listed or let any school hear (or see) a packet in a way that we don&rsquo;t know about. This is vital for protecting the integrity of competition throughout the state. Sound good?</p>
                    <p className="form-submit-container">
                        <Button
                            type="submit"
                            onClick={this.assignPackets}
                            variant="contained"
                        >
                            Accept These Packets and Terms
                        </Button>
                    </p>
                </>
            )
        }
    }
}
