import * as ActionTypes from "../ActionTypes";
import API_URL from "../../config/Api";
import Payments from "../../api/Payments";
import Validation from "../../utils/Validation";
import ActiveDomain from "./ActiveDomain";

/**
 * Fetch User's Subscription from Stripe
 * @param {string} customerId Stripe Customer ID
 * @param {boolean} update Update Operation does not dispatch loading indicator
 */
const getUserSubscriptions = (customerId, update) => {
    return async (dispatch) => {
        if (!update) {
            dispatch({
                type: ActionTypes.FETCHING_ACCOUNTS_SUBSCRIPTION,
            });
        }
        try {
            const stripeCustomer = await Payments.getCustomerFromStripe(customerId);
            if (stripeCustomer) {
                await dispatch({
                    type: ActionTypes.FETCHING_ACCOUNTS_SUBSCRIPTION_SUCCESS,
                    payload: stripeCustomer,
                });
            }
        } catch (error) {
            dispatch({
                type: ActionTypes.FETCHING_ACCOUNTS_SUBSCRIPTION_FAIL,
                payload: error,
            });
            throw error;
        }
    };
};

const getConversionRates = () => {
    return async (dispatch) => {
        try {
            const rates = await Payments.getConversionRates();
            console.log(rates);
            if (rates) {
                dispatch({
                    type: ActionTypes.SET_CONVERSION_RATES,
                    payload: rates,
                });
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    };
};

const getUserAccounts = (id) => {
    return async (dispatch) => {
        dispatch({
            type: ActionTypes.FETCHING_ACCOUNTS,
        });
        try {
            const settings = {
                method: "GET",
                headers: {},
            };

            const response = await fetch(`${API_URL}/account/${id}`, settings);
            const responseJson = await response.json();
            if (responseJson.domains.filter((item) => item.is_deleted === false).length) {
                console.log("responseJson.domains", responseJson.domains);
                // Domains should always have length of atleast 1 at this point.
                await dispatch(
                    ActiveDomain.setDomainActive(
                        [...responseJson.domains]
                            .filter((item) => item.is_deleted === false)
                            .sort((a, b) => {
                                if (a.domain_name.toLowerCase() < b.domain_name.toLowerCase()) {
                                    return -1;
                                }
                                if (a.domain_name.toLowerCase() > b.domain_name.toLowerCase()) {
                                    return 1;
                                }
                                return 0;
                            })[0]
                    )
                );
            }
            if (responseJson.stripe_token) {
                await dispatch(getUserSubscriptions(responseJson.stripe_token));
            }

            dispatch({
                type: ActionTypes.FETCHING_ACCOUNTS_SUCCESS,
                payload: {
                    ...responseJson,
                    stripe_token: responseJson.stripe_token,
                },
            });
        } catch (error) {
            console.log("Fetch Account Error: ", error);
            dispatch({
                type: ActionTypes.FETCHING_ACCOUNTS_FAIL,
                payload: error,
            });
        }
    };
};

const updateUserAccount = (accountId, data) => {
    return async (dispatch) => {
        dispatch({
            type: ActionTypes.UPDATING_ACCOUNTS,
        });
        try {
            const settings = {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            };

            const response = await fetch(`${API_URL}/account/${accountId}`, settings);
            const responseJson = await response.json();
            console.log(responseJson);
            dispatch({
                type: ActionTypes.UPDATE_ACCOUNTS_SUCCESS,
                payload: responseJson,
            });
            return responseJson;
        } catch (error) {
            console.log("Update Account Error: ", error);
            dispatch({
                type: ActionTypes.UPDATE_ACCOUNTS_FAIL,
                payload: error,
            });
            return null;
        }
    };
};

const fetchLatestAccount = (id, cb = () => {}) => {
    return async (dispatch) => {
        try {
            const settings = {
                method: "GET",
                headers: {},
            };
            const response = await fetch(`${API_URL}/account/${id}`, settings);
            const responseJson = await response.json();
            await dispatch({
                type: ActionTypes.FETCHING_ACCOUNTS_SUCCESS,
                payload: responseJson,
            });
            cb(responseJson);
            return responseJson;
        } catch (error) {
            console.log("Fetch Account Error: ", error);
            return null;
        }
    };
};

const checkSubscription = (accounts) => {
    return async (dispatch, getState) => {
        if (!accounts || accounts.isFetching) {
            return;
        }

        // Lấy trạng thái subscription hiện tại
        const currentState = getState();
        const currentSubscriptionStatus = currentState.accounts.subscriptionValid;

        // Kiểm tra subscription mới
        const validSubscription = accounts.subscription && Validation.hasValidSubscription(accounts);

        // Chỉ dispatch khi trạng thái thay đổi
        if (currentSubscriptionStatus !== validSubscription) {
            dispatch({
                type: validSubscription ? ActionTypes.SUBSCRIPTION_VALID : ActionTypes.SUBSCRIPTION_INVALID,
                payload: validSubscription ? validSubscription : "Invalid Subscription",
            });
        }
        // if (accounts.subscription) {
        //     const validSubscription = Validation.hasValidSubscription(accounts);
        //     if (validSubscription) {
        //         dispatch({
        //             type: ActionTypes.SUBSCRIPTION_VALID,
        //             payload: validSubscription
        //         });
        //     } else {
        //         dispatch({
        //             type: ActionTypes.SUBSCRIPTION_INVALID,
        //             payload: 'Invalid Subscription'
        //         });
        //         // if (!activeDomain.monitoring_only) {
        //         // await dispatch(
        //         //   ActiveDomain.updateDomain(activeDomain.id, {
        //         //     id: activeDomain.id,
        //         //     monitoring_only: true
        //         //   })
        //         // );
        //         // }
        //     }
        // } else {
        //     dispatch({
        //         type: ActionTypes.SUBSCRIPTION_INVALID,
        //         payload: 'Invalid Subscription'
        //     });
        //     // if (activeDomain && activeDomain.id && !activeDomain.monitoring_only) {
        //     //   await dispatch(
        //     //     ActiveDomain.updateDomain(activeDomain.id, {
        //     //       id: activeDomain.id,
        //     //       monitoring_only: true
        //     //     })
        //     //   );
        //     // }
        // }
    };
};

export default {
    getUserAccounts,
    updateUserAccount,
    fetchLatestAccount,
    getUserSubscriptions,
    checkSubscription,
    getConversionRates,
};
