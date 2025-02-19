import * as ActionTypes from '../ActionTypes';
import GoogleAds from '../../api/GoogleAds';

const fetchLatestBlocklist = accountId => {
    return async dispatch => {
        dispatch({
            type: ActionTypes.FETCHING_BLOCKLIST
        });

        try {
            const result = await GoogleAds.getAllBlockedIpAddresses(accountId);
            dispatch({
                type: ActionTypes.FETCHING_BLOCKLIST_SUCCESS,
                payload: result
            });
            return result;
        } catch (error) {
            dispatch({
                type: ActionTypes.FETCHING_BLOCKLIST_FAIL,
                payload: error
            });
            throw error;
        }
    };
};

export default {
    fetchLatestBlocklist
};