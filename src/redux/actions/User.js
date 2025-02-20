import * as ActionTypes from "../ActionTypes";
import API_URL from "../../config/Api";
import store from "../Store";
import Account from "./Account";

const signOut = async () => {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("start_date");
        localStorage.removeItem("end_date");
        localStorage.removeItem("duration");
        localStorage.removeItem("active_domain");

        store.dispatch({
            type: ActionTypes.RESET_ACCOUNTS,
        });
        store.dispatch({
            type: ActionTypes.RESET_BLOCKLIST,
        });
        store.dispatch({
            type: ActionTypes.RESET_DOMAIN_ACTIVE,
        });
        console.log("Sign out success");
    } catch (error) {
        console.log(error);
    }
};

const getUser = (userId) => {
    return async (dispatch) => {
        dispatch({
            type: ActionTypes.FETCHING_USER,
        });

        try {
            const token = localStorage.getItem("token");
            const settings = {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            };

            const response = await fetch(`${API_URL}/user/${userId}`, settings);
            const responseJson = await response.json();

            if (response.ok) {
                if (responseJson.deleted) {
                    dispatch({
                        type: ActionTypes.SET_USER_DELETED,
                        payload: true,
                    });
                    await signOut();
                    return;
                }

                dispatch(Account.getUserAccounts(responseJson.account_id));
                dispatch({
                    type: ActionTypes.FETCHING_USER_SUCCESS,
                    payload: responseJson,
                });
            } else {
                throw new Error(responseJson.message);
            }
        } catch (error) {
            console.log("Fetch User Error: ", error);
            dispatch({
                type: ActionTypes.FETCHING_USER_FAIL,
                payload: error.message,
            });
        }
    };
};

const createUser = (userData) => {
    return async (dispatch) => {
        console.log("Creating User -> ", userData);

        const settings = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        };

        try {
            const response = await fetch(`${API_URL}/user`, settings);
            const responseJson = await response.json();

            if (response.ok) {
                dispatch({
                    type: ActionTypes.CREATING_USER_SUCCESS,
                    payload: responseJson,
                });
                return responseJson;
            }

            throw new Error(responseJson.message);
        } catch (error) {
            console.error(error);
            dispatch({
                type: ActionTypes.CREATING_USER_FAIL,
                payload: error.message,
            });
            throw error;
        }
    };
};

const updateUser = (id, data) => {
    return async (dispatch) => {
        dispatch({
            type: ActionTypes.UPDATING_USER,
        });

        const token = localStorage.getItem("token");
        const settings = {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        try {
            const response = await fetch(`${API_URL}/user/${id}`, settings);
            const responseJson = await response.json();

            if (response.ok) {
                dispatch({
                    type: ActionTypes.UPDATE_USER_SUCCESS,
                    payload: responseJson,
                });
                return responseJson;
            }

            throw new Error(responseJson.message);
        } catch (error) {
            console.error(error);
            dispatch({
                type: ActionTypes.UPDATE_USER_FAIL,
                payload: error.message,
            });
            throw error;
        }
    };
};

const login = (email, password) => async (dispatch) => {
    // Thay đổi ở đây
    dispatch({
        type: ActionTypes.AUTHENTICATING,
    });

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);

            // Thay vì dispatch action creator trực tiếp
            // dispatch(getUser(data.id))
            // Ta dispatch kết quả của action creator
            await dispatch(getUser(data.id));

            return data;
        }

        throw new Error(data.message);
    } catch (error) {
        console.log("Login error:", error);
        dispatch({
            type: ActionTypes.AUTHENTICATION_FAIL,
            payload: error.message,
        });
        throw error;
    }
};

const register = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            return data;
        }

        throw new Error(data.message);
    } catch (error) {
        console.log("Registration error:", error);
        throw error;
    }
};

const resetPassword = async (email) => {
    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            return data;
        }

        throw new Error(data.message);
    } catch (error) {
        console.log("Reset password error:", error);
        throw error;
    }
};

const updatePassword = async (userId, currentPassword, newPassword) => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/auth/update-password`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                currentPassword,
                newPassword,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            return data;
        }

        throw new Error(data.message);
    } catch (error) {
        console.log("Update password error:", error);
        throw error;
    }
};

export default {
    signOut,
    getUser,
    createUser,
    updateUser,
    login,
    register,
    resetPassword,
    updatePassword,
};
