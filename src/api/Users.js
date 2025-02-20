import API_URL from "../config/Api";

const inviteUser = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    try {
        const response = await fetch(`${API_URL}/user/invite`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        const err = await response.clone().text();
        if (err.indexOf("error") > -1) {
            throw Error(JSON.parse(err).error);
        } else {
            throw Error(err || "An error occurred inviting this user.");
        }
    } catch (error) {
        console.log("Invite User Error: ", error);
        throw error;
    }
};

const resendInvite = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    try {
        const response = await fetch(`${API_URL}/user/invite/resend`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error("An error occurred resending to this user.");
    } catch (error) {
        console.log("Resend Invite User Error: ", error);
        throw error;
    }
};

const getAllUsersInAccount = async (accountId) => {
    const settings = {
        method: "GET",
        headers: {},
    };
    try {
        const response = await fetch(`${API_URL}/users/account/${accountId}`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error("An error occurred getting all users in this account.");
    } catch (error) {
        console.log("Get All Users in account error: ", error);
        throw error;
    }
};

const setPassword = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    try {
        const response = await fetch(`${API_URL}/user/set-password`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        const text = await response.clone().text();
        throw Error(text);
    } catch (error) {
        console.log("Invite User Error: ", error.message);
        throw error;
    }
};

const updateAccountUser = async (id, data) => {
    console.log("UPDATING ACCOUNT USER WITH: ", data);
    const settings = {
        method: "PUT",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    try {
        const response = await fetch(`${API_URL}/user/${id}`, settings);
        if (response.status === 200) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error("An error occurred updating user");
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const checkInvitationExpiration = async (id) => {
    const settings = {
        method: "GET",
        headers: {},
    };
    try {
        const response = await fetch(`${API_URL}/user/invite/${id}/expiration`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson.expired;
        }
        throw Error(`An error occurred checking the invitation's expiration.`);
    } catch (error) {
        console.log(`Checking the invitation's expiration error: `, error);
        throw error;
    }
};

const removeUser = async (id) => {
    const settings = {
        method: "DELETE",
        headers: {},
    };
    try {
        const response = await fetch(`${API_URL}/user/${id}`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error(`An error occurred removing user.`);
    } catch (error) {
        console.log(`Remove user error: `, error);
        throw error;
    }
};

const removeInvitation = async (email) => {
    const settings = {
        method: "DELETE",
        headers: {},
    };
    try {
        const response = await fetch(`${API_URL}/user/invite/${email}`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        throw Error(`An error occurred removing expiration`);
    } catch (error) {
        console.log(`Delete invitation error: `, error);
        throw error;
    }
};

const generatePasswordReset = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    try {
        const response = await fetch(`${API_URL}/user/password-reset`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            console.log(responseJson);
            return responseJson;
        }
        const text = await response.clone().text();
        if (text.toLowerCase().includes("email")) {
            throw Error("Email not found.");
        } else {
            throw Error(text);
        }
    } catch (error) {
        console.log("Password Reset Error: ", error.message);
        throw error;
    }
};

const welcomeUser = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    try {
        const response = await fetch(`${API_URL}/user/welcome`, settings);
        if (response.ok) {
            return response;
        }
        throw Error(`Status ${response.status}`);
    } catch (error) {
        console.log("welcome user error: ", error.message);
        return {
            success: true,
        };
        // throw error;
    }
};

const validateEmail = async (email) => {
    const settings = {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    };
    try {
        const response = await fetch(`${API_URL}/user/validate/${email}`, settings);
        if (response.ok) {
            return response;
        }
        throw Error(`Please provide a valid email`);
    } catch (error) {
        console.log("Email validation error: ", error.message);
        throw error;
    }
};

const checkIfDomainActive = async (domain) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            domain,
        }),
    };
    try {
        const response = await fetch(`${API_URL}/user/validate-domain`, settings);
        if (response.ok) {
            return true;
        }
        throw Error("The entered website must be active");
    } catch (error) {
        console.log("Domain validation error:", error.message);
        throw Error(`The entered website must be active`);
    }
};

const linkAppSumoAccount = async (data) => {
    const settings = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
    try {
        const response = await fetch(`${API_URL}/appsumo/link`, settings);
        if (response.ok) {
            const responseJson = await response.json();
            return responseJson;
        }
        throw Error("Something went wrong");
    } catch (error) {
        console.log("Account linking error:", error.message);
        throw Error(error.message);
    }
};

export default {
    inviteUser,
    getAllUsersInAccount,
    setPassword,
    updateAccountUser,
    resendInvite,
    checkInvitationExpiration,
    removeUser,
    removeInvitation,
    generatePasswordReset,
    welcomeUser,
    validateEmail,
    checkIfDomainActive,
    linkAppSumoAccount,
};
