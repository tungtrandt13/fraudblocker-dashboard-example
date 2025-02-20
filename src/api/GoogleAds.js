import Utils from "../utils/Utils";
import API_URL from "../config/Api";
import firebase from "../config/firebase-config";

const authorizeUser = async (authorizationCode, domainId, accountId) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            authCode: authorizationCode,
            accountId,
        }),
    };

    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/communication/auth/${domainId}`, settings);
        const responseJson = await response.json();
        console.log(responseJson);
        if (response.ok) {
            Utils.setAccessToken(`google-${domainId}`, responseJson.access_token || responseJson.refresh_token);
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const disconnectClient = async (id) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                token: idToken,
            },
        };
        const response = await fetch(`${API_URL}/communication/disconnect-client/${id}`, settings);
        const responseJson = await response.json();

        if (response.ok) {
            localStorage.removeItem("access_token");
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const disconnectGoogleAds = async (email) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                token: idToken,
            },
            body: JSON.stringify({
                email,
            }),
        };
        const response = await fetch(`${API_URL}/communication/disconnect`, settings);
        const responseJson = await response.json();

        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const inviteManagerAccount = async (body) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                token: idToken,
            },
            body: JSON.stringify(body),
        };
        const response = await fetch(`${API_URL}/communication/invite-manager`, settings);
        const responseJson = await response.json();

        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const disconnectDomain = async (id) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                token: idToken,
            },
        };
        const response = await fetch(`${API_URL}/communication/disconnect-domain/${id}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            localStorage.removeItem("access_token");
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const clearConnection = async (domainId) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                token: idToken,
            },
        };
        const response = await fetch(`${API_URL}/communication/remove/${domainId}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            localStorage.removeItem("access_token");
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const connectClient = async (data) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                token: idToken,
            },
            body: JSON.stringify(data),
        };
        const response = await fetch(`${API_URL}/communication/connect-client`, settings);
        const responseJson = await response.json();

        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const getCustomerClients = async (accountId, domainId, fetchedIdToken = null) => {
    let accessToken = fetchedIdToken ? null : Utils.getAccessToken(`google-${domainId}`);
    try {
        const idToken = fetchedIdToken || (await firebase.auth().currentUser.getIdToken(false));
        const settings = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                token: idToken,
            },
        };
        if (!accessToken) {
            const newSettings = {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    token: idToken,
                },
            };
            const response = await fetch(`${API_URL}/communication/token/refresh/${domainId}`, newSettings);
            if (!response.ok) {
                throw Error("Could not get refresh token, please sign in again");
            }
            const responseJson = await response.json();
            accessToken = responseJson.access_token;
            Utils.setAccessToken(`google-${domainId}`, responseJson.access_token);
        }
        settings.body = JSON.stringify({
            accessToken,
            accountId,
            domainId,
        });
        const response = await fetch(`${API_URL}/communication/customerClients`, settings);
        const responseJson = await response.json();
        console.log(responseJson);

        if (response.ok) {
            return responseJson;
        }
        // check if the response is unauthorized and access token refetching is not done, if yes, recall the method
        if (response.status === 401 && !fetchedIdToken) {
            return getCustomerClients(accountId, domainId, idToken);
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const testGoogleAdsIntegration = async (domainId) => {
    try {
        const accessToken = Utils.getAccessToken(`google-${domainId}`);
        if (!accessToken) {
            throw Error("No Access Token found, please authenticate with Google before proceeding");
        }
        const data = {
            accessToken,
        };
        const settings = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/communication/test-integration`, settings);
        const responseJson = await response.json();
        console.log(responseJson);
        if (response.status === 401) {
            return "Unauthorized";
        }
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const refreshAccessToken = async (domainId) => {
    const settings = {
        method: "GET",
        headers: {},
    };

    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/communication/token/refresh/${domainId}`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            Utils.setAccessToken(`google-${domainId}`, responseJson.access_token);
            return responseJson;
        }
        throw Error(`${response.status} ${response.statusText}`);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const getAllBlockedIpAddresses = async (accountId) => {
    try {
        const settings = {
            method: "GET",
            headers: {},
        };
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/ipBlocks/${accountId}`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error("Error getting IP Blocklist");
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const addIpToBlocklist = async (data) => {
    try {
        const settings = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/ipBlocks/add`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error("An error occurred adding to blocklist.");
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const removeIpFromBlocklist = async (data) => {
    try {
        const settings = {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/ipBlocks/remove`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error("An error occurred removing IP Address from blocklist.");
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export default {
    authorizeUser,
    testGoogleAdsIntegration,
    refreshAccessToken,
    addIpToBlocklist,
    removeIpFromBlocklist,
    getAllBlockedIpAddresses,
    getCustomerClients,
    disconnectClient,
    clearConnection,
    disconnectDomain,
    connectClient,
    inviteManagerAccount,
    disconnectGoogleAds,
};
