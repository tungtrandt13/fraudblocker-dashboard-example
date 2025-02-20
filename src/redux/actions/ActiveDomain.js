import * as ActionTypes from "../ActionTypes";
import Domains from "../../api/Domains";

const setDomainActive = (domain) => {
    // const doReload =
    //   !localStorage.getItem('active_domain') ||
    //   JSON.stringify(domain) !== localStorage.getItem('active_domain');
    // localStorage.setItem('active_domain', JSON.stringify(domain));
    return (dispatch) => {
        dispatch({
            type: ActionTypes.SET_DOMAIN_ACTIVE,
            payload: domain,
        });
        // if (
        //   doReload &&
        //   window.location.pathname.indexOf('register') === -1 &&
        //   window.location.pathname.indexOf('login') === -1
        // ) {
        //   window.location.reload();
        // }
    };
};

const updateDomain = (id, data, noLoader = false) => {
    return async (dispatch) => {
        dispatch({
            type: ActionTypes.UPDATING_DOMAIN,
            payload: {
                isUpdating: !noLoader,
            },
        });
        try {
            const responseJson = await Domains.updateDomain(id, data);
            dispatch({
                type: ActionTypes.UPDATE_DOMAIN_SUCCESS,
                payload: responseJson,
            });
            dispatch({
                type: ActionTypes.UPDATE_ACCOUNT_DOMAINS,
                payload: responseJson,
            });
            return responseJson;
        } catch (error) {
            console.log("Update Account Error: ", error);
            dispatch({
                type: ActionTypes.UPDATE_DOMAIN_FAIL,
                payload: error,
            });
            throw error;
        }
    };
};

export default {
    setDomainActive,
    updateDomain,
};
