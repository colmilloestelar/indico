/* This file is part of Indico.
 * Copyright (C) 2002 - 2018 European Organization for Nuclear Research (CERN).
 *
 * Indico is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 3 of the
 * License, or (at your option) any later version.
 *
 * Indico is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Indico; if not, see <http://www.gnu.org/licenses/>.
 */

import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {stateToQueryString} from 'redux-router-querystring';
import {Label, Message, Segment} from 'semantic-ui-react';
import {Translate, Param} from 'indico/react/i18n';
import {isDateWithinRange, pushStateMergeProps} from '../util';
import {queryString as queryStringSerializer} from '../serializers/filters';
import TimelineBase from './TimelineBase';
import * as actions from '../actions';

import './Timeline.module.scss';


const DATE_FORMAT = 'YYYY-MM-DD';
const _toMoment = (date) => moment(date, DATE_FORMAT);

class BookingTimeline extends React.Component {
    static propTypes = {
        minHour: PropTypes.number.isRequired,
        maxHour: PropTypes.number.isRequired,
        dateRange: PropTypes.array.isRequired,
        availability: PropTypes.object.isRequired,
        pushState: PropTypes.func.isRequired,

        // from redux state
        isFetching: PropTypes.bool.isRequired,
        isFetchingRooms: PropTypes.bool.isRequired,
        recurrenceType: PropTypes.string.isRequired,
    };

    state = {};

    static getDerivedStateFromProps({dateRange}, state) {
        if (!_.isEmpty(dateRange) && !isDateWithinRange(state.activeDate, dateRange, _toMoment)) {
            return {...state, activeDate: _toMoment(dateRange[0])};
        } else {
            return state;
        }
    }

    get singleRoom() {
        const {availability} = this.props;
        const keys = Object.keys(availability);
        return keys.length === 1 && availability[keys[0]];
    }

    _getRowSerializer(dt, singleRoom = false) {
        return ({candidates, pre_bookings: preBookings, bookings, pre_conflicts: preConflicts, conflicts,
                 blockings, nonbookable_periods: nonbookablePeriods, unbookable_hours: unbookableHours,
                 room}) => {
            const av = {
                candidates: candidates[dt].map((cand) => ({...cand, bookable: true})) || [],
                preBookings: preBookings[dt] || [],
                bookings: bookings[dt] || [],
                conflicts: conflicts[dt] || [],
                preConflicts: preConflicts[dt] || [],
                blockings: blockings[dt] || [],
                nonbookablePeriods: nonbookablePeriods[dt] || [],
                unbookableHours: unbookableHours || []
            };
            const {full_name: fullName, id} = room;

            return {
                availability: av,
                label: singleRoom ? dt : fullName,
                key: singleRoom ? dt : id,
                conflictIndicator: true,
                room
            };
        };
    }

    calcRows = () => {
        const {activeDate} = this.state;
        const {availability, dateRange} = this.props;

        if (!activeDate) {
            return [];
        }

        if (this.singleRoom) {
            const roomAvailability = this.singleRoom;
            return dateRange.map(dt => this._getRowSerializer(dt, true)(roomAvailability));
        } else {
            const dt = activeDate.format('YYYY-MM-DD');
            return Object.values(availability).map(this._getRowSerializer(dt));
        }
    };

    openBookingModal = (room) => {
        const {pushState} = this.props;
        pushState(`/book/${room.id}/confirm`, true);
    };

    renderRoomSummary({room: {full_name: fullName}}) {
        return (
            <Segment>
                <Translate>Availability for room <Param name="roomName" value={<strong>{fullName}</strong>} /></Translate>
            </Segment>
        );
    }

    render() {
        const {dateRange, maxHour, minHour, isFetching, isFetchingRooms, recurrenceType} = this.props;
        const {activeDate} = this.state;
        const legend = (
            <>
                <Label color="green">{Translate.string('Available')}</Label>
                <Label color="orange">{Translate.string('Booked')}</Label>
                <Label styleName="pre-booking">{Translate.string('Pre-Booking')}</Label>
                <Label color="red">{Translate.string('Conflict')}</Label>
                <Label styleName="pre-booking-conflict">{Translate.string('Conflict with Pre-Booking')}</Label>
                <Label styleName="blocking">{Translate.string('Blocked')}</Label>
                <Label styleName="unbookable">{Translate.string('Not bookable')}</Label>
            </>
        );
        const emptyMessage = (
            <Message warning>
                <Translate>
                    There are no rooms matching the criteria.
                </Translate>
            </Message>
        );

        return (
            <TimelineBase rows={this.calcRows()}
                          legend={legend}
                          emptyMessage={emptyMessage}
                          onClick={this.openBookingModal}
                          dateRange={dateRange}
                          minHour={minHour}
                          maxHour={maxHour}
                          activeDate={activeDate}
                          onDateChange={(newDate) => {
                              this.setState({
                                  activeDate: newDate
                              });
                          }}
                          extraContent={this.singleRoom && this.renderRoomSummary(this.singleRoom)}
                          isLoading={isFetching || isFetchingRooms}
                          recurrenceType={recurrenceType}
                          disableDatePicker={!!this.singleRoom} />
        );
    }
}

export default connect(
    ({bookRoom}) => {
        return {
            ...bookRoom.timeline,
            recurrenceType: bookRoom.filters.recurrence.type,
            queryString: stateToQueryString(bookRoom, queryStringSerializer),
            isFetchingRooms: bookRoom.rooms.isFetching
        };
    },
    dispatch => ({
        resetBookingState: () => {
            dispatch(actions.resetBookingState());
        },
        dispatch
    }),
    pushStateMergeProps
)(BookingTimeline);
