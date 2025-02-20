import * as ActionsTypes from "../ActionTypes";

const initialState = {
    data: undefined,
    isFetching: true,
    error: undefined,
    subscription: undefined,
    fetchingSubscription: true,
    subscriptionValid: true, // default true
    subscriptionError: undefined,
    conversionRates: null,
};

export default (state = initialState, { type, payload }) => {
    switch (type) {
        case ActionsTypes.FETCHING_ACCOUNTS:
            return Object.assign({}, state, {
                isFetching: true,
                error: undefined,
            });

        case ActionsTypes.RESET_ACCOUNTS:
            return Object.assign({}, state, {
                isFetching: false,
                error: undefined,
                subscription: undefined,
                subscriptionValid: false,
                subscriptionError: undefined,
                data: undefined,
                fetchingSubscription: false,
            });

        case ActionsTypes.SET_CONVERSION_RATES:
            return Object.assign({}, state, {
                conversionRates: payload,
            });

        case ActionsTypes.FETCHING_ACCOUNTS_SUCCESS:
            return Object.assign({}, state, {
                data: payload,
                isFetching: false,
                error: undefined,
            });

        case ActionsTypes.FETCHING_ACCOUNTS_FAIL:
            return Object.assign({}, state, {
                data: undefined,
                isFetching: false,
                error: payload,
                subscription: undefined,
                subscriptionValid: false,
                subscriptionError: payload,
            });

        case ActionsTypes.UPDATE_ACCOUNTS_SUCCESS:
            return Object.assign({}, state, {
                data: payload,
                error: undefined,
            });

        case ActionsTypes.UPDATE_ACCOUNT_DOMAINS:
            return Object.assign({}, state, {
                data: {
                    ...state.data,
                    domains: state.data.domains.map((item) => {
                        if (item.id === payload.id) {
                            return { ...item, ...payload };
                        }
                        return item;
                    }),
                },
                error: undefined,
            });

        case ActionsTypes.UPDATE_ACCOUNTS_FAIL:
            return Object.assign({}, state, {
                error: payload,
            });

        case ActionsTypes.FETCHING_ACCOUNTS_SUBSCRIPTION:
            return Object.assign({}, state, {
                fetchingSubscription: true,
                subscriptionError: undefined,
            });

        case ActionsTypes.FETCHING_ACCOUNTS_SUBSCRIPTION_SUCCESS:
            return Object.assign({}, state, {
                subscription: payload,
                fetchingSubscription: false,
                subscriptionError: undefined,
            });

        case ActionsTypes.FETCHING_ACCOUNTS_SUBSCRIPTION_FAIL:
            return Object.assign({}, state, {
                fetchingSubscription: false,
                subscriptionError: payload,
                subscription: undefined,
                subscriptionValid: false,
            });

        case ActionsTypes.SUBSCRIPTION_VALID:
            return Object.assign({}, state, {
                subscriptionValid: true,
                subscriptionError: undefined,
            });

        case ActionsTypes.SUBSCRIPTION_INVALID:
            return Object.assign({}, state, {
                subscriptionValid: false,
                subscriptionError: payload,
            });

        default:
            return state;
    }
};
