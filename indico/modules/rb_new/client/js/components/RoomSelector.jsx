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

import React from 'react';
import PropTypes from 'prop-types';
import {Button, Dropdown, Grid, Icon, Image, List, Message, Segment} from 'semantic-ui-react';
import getLocationsURL from 'indico-url:rooms_new.locations';
import {indicoAxios, handleAxiosError} from 'indico/utils/axios';
import {Translate} from 'indico/react/i18n';

import './RoomSelector.module.scss';


const fetchLocations = async () => {
    let response;
    try {
        response = await indicoAxios.get(getLocationsURL());
    } catch (error) {
        handleAxiosError(error);
        return;
    }

    return response;
};


export default class RoomSelector extends React.Component {
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        initialValue: PropTypes.array,
        disabled: PropTypes.bool
    };

    static defaultProps = {
        initialValue: [],
        disabled: false
    };

    constructor(props) {
        super(props);
        const {initialValue, onChange} = this.props;

        if (initialValue) {
            onChange(initialValue);
        }

        this.state = {
            isFetchingLocations: false,
            locations: [],
            selectedLocation: null,
            selectedRoom: null,
            selectedRooms: initialValue
        };
    }

    componentDidMount() {
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({isFetchingLocations: true}, async () => {
            const result = await fetchLocations();
            this.setState({locations: result.data, isFetchingLocations: false});
        });
    }

    removeItem = (room) => {
        const {selectedRooms} = this.state;
        const {onChange} = this.props;
        const newRooms = selectedRooms.filter((selectedRoom) => selectedRoom.id !== room.id);

        this.setState({selectedRooms: newRooms}, () => {
            onChange(newRooms);
        });
    };

    renderRoomItem = (room) => {
        const {disabled} = this.props;
        return (
            <List.Item key={room.id}>
                <Image src={room.large_photo_url} size="mini" />
                <List.Content>
                    <List.Header>{room.full_name}</List.Header>
                </List.Content>
                {!disabled && (
                    <List.Content styleName="remove-btn-content">
                        <Icon name="remove"
                              onClick={() => this.removeItem(room)} />
                    </List.Content>
                )}
            </List.Item>
        );
    };

    render() {
        const {onChange, disabled} = this.props;
        const {locations, selectedLocation, selectedRoom, selectedRooms: rooms, isFetchingLocations} = this.state;
        const locationOptions = locations
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((location) => ({text: location.name, value: location.id}));
        let roomOptions = [];
        if (selectedLocation) {
            roomOptions = selectedLocation.rooms
                .filter((room) => rooms.findIndex((item) => item.id === room.id) === -1)
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map((room) => ({text: room.full_name, value: room.id}));
        }

        return (
            <Grid styleName="room-selector">
                <Grid.Row>
                    <Grid.Column width={5}>
                        <Dropdown placeholder={Translate.string('Location')}
                                  options={locationOptions}
                                  value={selectedLocation && selectedLocation.id}
                                  loading={isFetchingLocations}
                                  onChange={(event, data) => {
                                      const selected = locations.find((loc) => loc.id === data.value);
                                      this.setState({selectedLocation: selected});
                                  }}
                                  disabled={disabled}
                                  fluid
                                  search
                                  selection />
                    </Grid.Column>
                    <Grid.Column width={9}>
                        <Dropdown placeholder={Translate.string('Room')}
                                  disabled={disabled || !selectedLocation}
                                  options={roomOptions}
                                  value={selectedRoom && selectedRoom.id}
                                  onChange={(event, data) => {
                                      const selected = selectedLocation.rooms.find((room) => room.id === data.value);
                                      this.setState({selectedRoom: selected});
                                  }}
                                  fluid
                                  search
                                  selection />
                    </Grid.Column>
                    <Grid.Column width={2}>
                        <Button floated="right"
                                icon="plus"
                                type="button"
                                disabled={disabled || !selectedRoom}
                                onClick={() => {
                                    const newRooms = [...rooms, selectedRoom];
                                    this.setState({
                                        selectedRooms: newRooms,
                                        selectedLocation: null,
                                        selectedRoom: null
                                    });
                                    onChange(newRooms);
                                }}
                                primary />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row styleName="selected-rooms-row">
                    <Grid.Column>
                        {rooms.length !== 0 && (
                            <Segment>
                                <List styleName="rooms-list"
                                      verticalAlign="middle"
                                      relaxed
                                      selection>
                                    {rooms.map(this.renderRoomItem)}
                                </List>
                            </Segment>
                        )}
                        {rooms.length === 0 && (
                            <Message info>
                                <Translate>
                                    There are no rooms selected for this blocking.
                                </Translate>
                            </Message>
                        )}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        );
    }
}
