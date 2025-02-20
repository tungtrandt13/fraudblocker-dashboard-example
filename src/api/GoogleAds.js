import Utils from '../utils/Utils';
import API_URL from '../config/Api';

const authorizeUser = async (authorizationCode, domainId, accountId) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            authCode: authorizationCode,
            accountId
        })
    };

    try {
        const response = await fetch(`${API_URL}/communication/auth/${domainId}`, settings);
        const responseJson = await response.json();
        
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

const disconnectClient = async id => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    try {
        const response = await fetch(`${API_URL}/communication/disconnect-client/${id}`, settings);
        const responseJson = await response.json();

        if (response.ok) {
            localStorage.removeItem('access_token');
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const disconnectGoogleAds = async email => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            email
        })
    };
    try {
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

const inviteManagerAccount = async body => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    };
    try {
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

const disconnectDomain = async id => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    try {
        const response = await fetch(`${API_URL}/communication/disconnect-domain/${id}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            localStorage.removeItem('access_token');
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const clearConnection = async domainId => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    try {
        const response = await fetch(`${API_URL}/communication/remove/${domainId}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            localStorage.removeItem('access_token');
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const connectClient = async data => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    };
    try {
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
    const token = localStorage.getItem('token');
    let accessToken = fetchedIdToken ? null : Utils.getAccessToken(`google-${domainId}`);
    try {
        const idToken = fetchedIdToken || localStorage.getItem('token');
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        if (!accessToken) {
            const newSettings = {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };
            const response = await fetch(
                `${API_URL}/communication/token/refresh/${domainId}`,
                newSettings
            );
            if (!response.ok) {
                throw Error('Could not get refresh token, please sign in again');
            }
            const responseJson = await response.json();
            accessToken = responseJson.access_token;
            Utils.setAccessToken(`google-${domainId}`, responseJson.access_token);
        }
        settings.body = JSON.stringify({
            accessToken,
            accountId,
            domainId
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
    const token = localStorage.getItem('token');
    const accessToken = Utils.getAccessToken(`google-${domainId}`);
    if (!accessToken) {
        throw Error('No Access Token found, please authenticate with Google before proceeding');
    }
    const data = {
        accessToken
    };
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    };
    const response = await fetch(`${API_URL}/communication/test-integration`, settings);
    const responseJson = await response.json();
    console.log(responseJson);
    if (response.status === 401) {
        return 'Unauthorized';
    }
    if (response.ok) {
        return responseJson;
    }
    throw Error(responseJson.error);
};

const refreshAccessToken = async domainId => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    try {
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

const getAllBlockedIpAddresses = async accountId => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    try {
        const response = await fetch(`${API_URL}/ipBlocks/${accountId}`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error('Error getting IP Blocklist');
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const addIpToBlocklist = async data => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    };
    try {
        const response = await fetch(`${API_URL}/ipBlocks/add`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error('An error occurred adding to blocklist.');
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const removeIpFromBlocklist = async data => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    };
    try {
        const response = await fetch(`${API_URL}/ipBlocks/remove`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error('An error occurred removing IP Address from blocklist.');
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const GoogleAds = {
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
    disconnectGoogleAds
};

export default GoogleAds;