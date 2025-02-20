import * as ActionTypes from "../ActionTypes";

const initialState = {
    data: {},
};

export default (state = initialState, { type, payload }) => {
    switch (type) {
        case ActionTypes.SET_DOMAIN_ACTIVE:
            return Object.assign({}, state, {
                data: payload,
            });

        case ActionTypes.RESET_DOMAIN_ACTIVE:
            return Object.assign({}, state, {
                data: {},
            });

        case ActionTypes.UPDATING_DOMAIN:
            return Object.assign({}, state, {
                isUpdating: payload.isUpdating,
                error: undefined,
            });

        case ActionTypes.UPDATE_DOMAIN_SUCCESS:
            return Object.assign({}, state, {
                data: {
                    ...state.data,
                    ...payload,
                },
                isUpdating: false,
                error: undefined,
            });

        case ActionTypes.UPDATE_DOMAIN_FAIL:
            return Object.assign({}, state, {
                error: payload,
                isUpdating: false,
            });

        default:
            return state;
    }
};
