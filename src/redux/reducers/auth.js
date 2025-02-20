import * as ActionTypes from '../ActionTypes';

const initialState = {
    user: null,
    isAuthenticating: false,
    error: null
};

export default function auth(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.AUTHENTICATING:
            return {
                ...state,
                isAuthenticating: true,
                error: null
            };
            
        case ActionTypes.AUTHENTICATION_SUCCESS:
            return {
                ...state,
                isAuthenticating: false,
                error: null
            };
            
        case ActionTypes.AUTHENTICATION_FAIL:
            return {
                ...state,
                user: null,
                isAuthenticating: false,
                error: action.payload
            };
            
        case ActionTypes.FETCHING_USER_SUCCESS:
            return {
                ...state,
                user: action.payload,
                isAuthenticating: false
            };
            
        default:
            return state;
    }
} 