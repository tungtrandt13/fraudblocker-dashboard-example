import API_URL from '../config/Api';
import firebase from '../config/firebase-config';

const getAllRoles = async () => {
    const settings = {
        method: 'GET',
        headers: {}
    };
    try {
        const idToken = await firebase.auth().currentUser.getIdToken(false);
        settings.headers.token = idToken;
        const response = await fetch(`${API_URL}/role/all`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error('An error occurred getting all roles.');
    } catch (error) {
        console.log('Get all roles error: ', error);
        throw error;
    }
};

export default {
    getAllRoles
};