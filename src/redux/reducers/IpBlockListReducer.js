import * as ActionTypes from '../ActionTypes';

const initialState = {
    data: [],
    whiteIPs: [],
    isFetching: false,
    error: undefined
};

export default (state = initialState, {
    type,
    payload
}) => {
    switch (type) {
        case ActionTypes.FETCHING_BLOCKLIST:
            return Object.assign({}, state, {
                isFetching: true,
                error: undefined
            });

        case ActionTypes.FETCHING_BLOCKLIST_SUCCESS:
            return Object.assign({}, state, {
                data: payload.filter(item => item.is_blocked === true),
                whiteIPs: payload.filter(item => item.is_blocked === false),
                isFetching: false,
                error: undefined
            });

        case ActionTypes.RESET_BLOCKLIST:
            return Object.assign({}, state, {
                data: [],
                whiteIPs: [],
                isFetching: false,
                error: undefined
            });

        case ActionTypes.FETCHING_BLOCKLIST_FAIL:
            return Object.assign({}, state, {
                data: [],
                isFetching: false,
                error: payload
            });

        default:
            return state;
    }
};