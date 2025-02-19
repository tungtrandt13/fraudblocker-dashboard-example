import Utils from '../utils/Utils';
import API_URL from '../config/Api';
import firebase from '../config/firebase-config';

const authorizeUser = async ({
    accessToken,
    domainId,
    accountId,
    metaUserId
}) => {
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessToken,
            accountId,
            metaUserId
        })
    };

    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/meta/auth/${domainId}`, settings);
        const responseJson = await response.json();
        console.log(responseJson);
        if (response.ok) {
            Utils.setAccessToken(`meta-${domainId}`, responseJson.access_token || responseJson.refresh_token);
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const getFbUserDetails = async (accessToken, metaUserId) => {
    const settings = {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };

    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(
            `${API_URL}/meta/user?accessToken=${accessToken}&metaUserId=${metaUserId}`,
            settings
        );
        const responseJson = await response.json();
        console.log(responseJson);
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const disconnectPixel = async id => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                token: idToken
            }
        };
        const response = await fetch(`${API_URL}/meta/disconnect-pixel/${id}`, settings);
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

const disconnectAdSet = async id => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                token: idToken
            }
        };
        const response = await fetch(`${API_URL}/meta/disconnect-adset/${id}`, settings);
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

const disconnectDomain = async id => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                token: idToken
            }
        };
        const response = await fetch(`${API_URL}/meta/disconnect-domain/${id}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            localStorage.removeItem('facebook_access_token');
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const connectPixel = async data => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                token: idToken
            },
            body: JSON.stringify(data)
        };
        const response = await fetch(`${API_URL}/meta/connect-pixel`, settings);
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

const connectAdSet = async data => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                token: idToken
            },
            body: JSON.stringify(data)
        };
        const response = await fetch(`${API_URL}/meta/connect-adset`, settings);
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

const getPixels = async (accessToken, accountId, domainId) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                token: idToken
            }
        };
        // if (!accessToken) {
        //   const newSettings = {
        //     method: 'GET',
        //     headers: {
        //       Accept: 'application/json',
        //       'Content-Type': 'application/json',
        //       token: idToken
        //     }
        //   };
        //   const response = await fetch(`${API_URL}/meta/token/refresh/${domainId}`, newSettings);
        //   if (!response.ok) {
        //     throw Error('Could not get refresh token, please sign in again');
        //   }
        //   const responseJson = await response.json();
        //   accessToken = responseJson.access_token;
        //   Utils.setAccessToken('facebook', responseJson.access_token);
        // }
        settings.body = JSON.stringify({
            accessToken,
            accountId,
            domainId
        });
        const response = await fetch(`${API_URL}/meta/pixels`, settings);
        const responseJson = await response.json();
        console.log(responseJson);

        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const getAccountAdSets = async (accessToken, adAccountId, accountId, domainId, pixelId) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                token: idToken
            }
        };
        // if (!accessToken) {
        //   const newSettings = {
        //     method: 'GET',
        //     headers: {
        //       Accept: 'application/json',
        //       'Content-Type': 'application/json',
        //       token: idToken
        //     }
        //   };
        //   const response = await fetch(`${API_URL}/meta/token/refresh/${domainId}`, newSettings);
        //   if (!response.ok) {
        //     throw Error('Could not get refresh token, please sign in again');
        //   }
        //   const responseJson = await response.json();
        //   accessToken = responseJson.access_token;
        //   Utils.setAccessToken('facebook', responseJson.access_token);
        // }
        settings.body = JSON.stringify({
            accessToken,
            adAccountId,
            accountId,
            domainId,
            pixelId
        });
        const response = await fetch(`${API_URL}/meta/adsets`, settings);
        const responseJson = await response.json();
        console.log(responseJson);

        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const postDebug = async (descriptor, data) => {
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                token: idToken
            },
            body: JSON.stringify({
                descriptor,
                data
            })
        };

        await fetch(`${API_URL}/meta/debug`, settings);
    } catch (error) {
        console.log(error);
    }
};

export default {
    authorizeUser,
    getPixels,
    getAccountAdSets,
    disconnectPixel,
    disconnectDomain,
    connectPixel,
    connectAdSet,
    disconnectAdSet,
    getFbUserDetails,
    postDebug
};