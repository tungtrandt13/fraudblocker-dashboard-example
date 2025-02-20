import API_URL from "../config/Api";

const removeApiKey = async (id) => {
    const settings = {
        method: "DELETE",
        headers: {},
    };
    try {
        const response = await fetch(`${API_URL}/api_keys/${id}`);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error(`An error occurred removing apikey.`);
    } catch (error) {
        console.log(`Remove apikey error: `, error);
        throw error;
    }
};

const addApiKey = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    try {
        // TODO: get idToken from firebase (skip to test mock ui)
        const idToken = "fakeToken";

        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/api_keys`);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error(`An error occurred adding apikey.`);
    } catch (error) {
        console.log(`add apikey error: `, error);
        throw error;
    }
};

const updateApiKey = async (id, data) => {
    const settings = {
        method: "PUT",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    try {
        const response = await fetch(`${API_URL}/api_keys/${id}`);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error(`An error occurred updating apikey.`);
    } catch (error) {
        console.log(`update apikey error: `, error);
        throw error;
    }
};

const getApiKeys = async () => {
    const settings = {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    };
    try {
        const response = await fetch(`${API_URL}/api_keys`);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error(`An error occurred updating apikey.`);
    } catch (error) {
        console.log(`update apikey error: `, error);
        throw error;
    }
};

export default {
    getApiKeys,
    removeApiKey,
    addApiKey,
    updateApiKey,
};
