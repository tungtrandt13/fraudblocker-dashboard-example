import API_URL from "../config/Api";

const getAllRoles = async () => {
    const settings = {
        method: "GET",
        headers: {},
    };
    try {
        
        const response = await fetch(`${API_URL}/role/all`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error("An error occurred getting all roles.");
    } catch (error) {
        console.log("Get all roles error: ", error);
        throw error;
    }
};

export default {
    getAllRoles,
};
