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

import {validator as v} from 'redux-router-querystring';


export const queryString = {
    date: {
        validator: (date) => v.isDate(date) && moment(date).isBetween('1970-01-01', '2999-12-31'),
        stateField: 'date'
    }
};


export const ajax = {
    start_date: ({date}) => date,
    end_date: ({date}) => date,
};
