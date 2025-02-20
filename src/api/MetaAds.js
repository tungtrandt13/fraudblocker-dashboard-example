import Utils from "../utils/Utils";
import API_URL from "../config/Api";

const authorizeUser = async ({ accessToken, metaUserId, domainId, accountId }) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            accessToken,
            metaUserId,
            accountId
        })
    };

    try {
        const response = await fetch(`${API_URL}/communication/auth/${domainId}`, settings);
        const responseJson = await response.json();
        
        if (response.ok) {
            Utils.setAccessToken(`meta-${domainId}`, responseJson.access_token);
            return responseJson;
        }
        throw Error(responseJson.error);
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const getFbUserDetails = async (accessToken, metaUserId) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
    };

    try {
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

const disconnectPixel = async (id) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
    };
    const response = await fetch(`${API_URL}/meta/disconnect-pixel/${id}`, settings);
    const responseJson = await response.json();

    if (response.ok) {
        return responseJson;
    }
    throw Error(responseJson.error);
};

const disconnectAdSet = async (id) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
    };
    const response = await fetch(`${API_URL}/meta/disconnect-adset/${id}`, settings);
    const responseJson = await response.json();

    if (response.ok) {
        return responseJson;
    }
    throw Error(responseJson.error);
};

const disconnectDomain = async (id) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
    };
    const response = await fetch(`${API_URL}/meta/disconnect-domain/${id}`, settings);
    const responseJson = await response.json();
    if (response.ok) {
        localStorage.removeItem("facebook_access_token");
        return responseJson;
    }
    throw Error(responseJson.error);
};

const connectPixel = async (data) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    };
    const response = await fetch(`${API_URL}/meta/connect-pixel`, settings);
    const responseJson = await response.json();

    if (response.ok) {
        return responseJson;
    }
    throw Error(responseJson.error);
};

const connectAdSet = async (data) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    };
    const response = await fetch(`${API_URL}/meta/connect-adset`, settings);
    const responseJson = await response.json();

    if (response.ok) {
        return responseJson;
    }
    throw Error(responseJson.error);
};

const getPixels = async (accessToken, accountId, domainId) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
    };
    settings.body = JSON.stringify({
        accessToken,
        accountId,
        domainId,
    });
    const response = await fetch(`${API_URL}/meta/pixels`, settings);
    const responseJson = await response.json();
    console.log(responseJson);

    if (response.ok) {
        return responseJson;
    }
    throw Error(responseJson.error);
};

const getAccountAdSets = async (accessToken, adAccountId, accountId, domainId, pixelId) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
    };
    settings.body = JSON.stringify({
        accessToken,
        adAccountId,
        accountId,
        domainId,
        pixelId,
    });
    const response = await fetch(`${API_URL}/meta/adsets`, settings);
    const responseJson = await response.json();
    console.log(responseJson);

    if (response.ok) {
        return responseJson;
    }
    throw Error(responseJson.error);
};

const postDebug = async (descriptor, data) => {
    const token = localStorage.getItem('token');
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            descriptor,
            data,
        }),
    };

    await fetch(`${API_URL}/meta/debug`, settings);
};

const MetaAds = {
    authorizeUser,
    getPixels,
    getAccountAdSets,
    disconnectPixel,
    disconnectDomain,
    connectPixel,
    connectAdSet,
    disconnectAdSet,
    getFbUserDetails,
    postDebug,
};

export default MetaAds;
