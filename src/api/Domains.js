import API_URL from '../config/Api';

const removeDomain = async id => {
    const settings = {
        method: 'DELETE',
        headers: {}
    };
    try {

        const response = await fetch(`${API_URL}/domain/${id}`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error(`An error occurred removing domain.`);
    } catch (error) {
        console.log(`Remove domain error: `, error);
        throw error;
    }
};

const addDomain = async data => {
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    try {

        const response = await fetch(`${API_URL}/domain/`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error(`An error occurred adding domain.`);
    } catch (error) {
        console.log(`add domain error: `, error);
        throw error;
    }
};

const updateDomain = async (id, data) => {
    const settings = {
        method: 'PUT',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    try {

        const response = await fetch(`${API_URL}/domain/${id}`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error(`An error occurred updating domain.`);
    } catch (error) {
        console.log(`update domain error: `, error);
        throw error;
    }
};

const restoreDomain = async id => {
    const settings = {
        method: 'PUT',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    try {

        const response = await fetch(`${API_URL}/domain/${id}/restore`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error(`An error occurred restoring domain.`);
    } catch (error) {
        console.log(`update domain error: `, error);
        throw error;
    }
};

const verifyTrackerTag = async domain => {
    const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(domain)
    };
    try {

        const response = await fetch(`${API_URL}/domain/verify-tracker`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error(`An error occurred updating domain.`);
    } catch (error) {
        console.log(`update domain error: `, error);
        throw error;
    }
};

export default {
    removeDomain,
    addDomain,
    updateDomain,
    verifyTrackerTag,
    restoreDomain
};