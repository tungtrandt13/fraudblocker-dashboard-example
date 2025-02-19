import * as ActionsTypes from '../ActionTypes';

const initialState = {
    user: undefined,
    isFetching: true,
    error: undefined,
    isDeleted: false
};

export default (state = initialState, {
    type,
    payload
}) => {
    switch (type) {
        case ActionsTypes.AUTHENTICATING:
            return Object.assign({}, state, {
                user: undefined,
                isFetching: true,
                error: undefined
            });
        case ActionsTypes.AUTHENTICATION_FAIL:
            return Object.assign({}, state, {
                user: undefined,
                isFetching: false,
                error: payload
            });
        case ActionsTypes.FETCHING_USER:
            return Object.assign({}, state, {
                user: undefined,
                isFetching: true,
                error: undefined
            });

        case ActionsTypes.FETCHING_USER_SUCCESS:
            return Object.assign({}, state, {
                isDeleted: false,
                user: payload,
                isFetching: false,
                error: undefined
            });

        case ActionsTypes.SET_USER_DELETED:
            return Object.assign({}, state, {
                isDeleted: payload,
                isFetching: false,
                error: undefined
            });

        case ActionsTypes.FETCHING_USER_FAIL:
            return Object.assign({}, state, {
                user: undefined,
                isFetching: false,
                error: payload
            });

        case ActionsTypes.CREATING_USER_SUCCESS:
            return Object.assign({}, state, {
                user: payload,
                isFetching: false,
                error: undefined
            });

        case ActionsTypes.CREATING_USER_FAIL:
            return Object.assign({}, state, {
                user: undefined,
                isFetching: false,
                error: payload
            });

        case ActionsTypes.UPDATE_USER_SUCCESS:
            return Object.assign({}, state, {
                user: { ...state.user,
                    ...payload
                },
                error: undefined
            });

        case ActionsTypes.UPDATE_USER_FAIL:
            return Object.assign({}, state, {
                error: payload
            });

        default:
            return state;
    }
};