import API_URL from "../config/Api";
import Utils from "../utils/Utils";

const getAllPlans = async () => {
    try {
        const settings = {
            method: "GET",
            headers: {},
        };

        const response = await fetch(`${API_URL}/billing/plans/all`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            if (responseJson && responseJson.data) {
                return {
                    data: Utils.sortAllPlans(responseJson.data),
                };
            }
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get All Plans Error: ", error);
        throw error;
    }
};

const getCouponDetails = async (couponId) => {
    try {
        const settings = {
            method: "GET",
            headers: {},
        };
        const response = await fetch(`${API_URL}/billing/coupon/${couponId}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Coupon Error Error: ", error);
        throw Error(error.message);
    }
};

const getConversionRates = async () => {
    try {
        const settings = {
            method: "GET",
            headers: {},
        };
        const response = await fetch(`${API_URL}/billing/exchange-rates`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Exchange Rates Error: ", error);
        throw error;
    }
};

const getAllCustomerInvoices = async (customerId, subscriptionId) => {
    try {
        const settings = {
            method: "GET",
            headers: {},
        };

        const response = await fetch(`${API_URL}/billing/invoices/${customerId}/${subscriptionId}`, settings);
        const responseJson = await response.json();
        console.log(responseJson);
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get All Invoices Error: ", error);
        throw error;
    }
};

const createCustomer = async (data) => {
    try {
        const token = localStorage.getItem("token");
        const settings = {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        const response = await fetch(`${API_URL}/billing/customer/create`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Create Customer Error: ", error);
        throw error;
    }
};

const updateCustomer = async (customerID, data) => {
    try {
        const token = localStorage.getItem("token");
        const settings = {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        const response = await fetch(`${API_URL}/billing/customer/update/${customerID}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Update Customer Error: ", error);
        throw error;
    }
};

const subscribeCustomerToPlan = async (data) => {
    /**
      Ex. data: {
    "customer": "cus_Ewpz8MJU95JVn8",
    "items": [{"plan": "plan_EwpIX2YFGhBC2T"}]
      }
      */
    console.log("Subscribe Customer: ", data);
    try {
        const token = localStorage.getItem("token");
        const settings = {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        const response = await fetch(`${API_URL}/billing/customer/subscribe`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Update Customer Error: ", error);
        throw Error(
            error.message.toLowerCase().indexOf("coupon")
                ? error.message
                : "An error occurred subscribing to selected plan."
        );
    }
};

const getCustomerFromStripe = async (customerId) => {
    try {
        const token = localStorage.getItem("token");
        const settings = {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        };

        const response = await fetch(`${API_URL}/billing/customer/${customerId}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Get Customer From Stripe Error: ", error);
        throw error;
    }
};

const updateCustomerSubscription = async (subscriptionId, data) => {
    try {
        const token = localStorage.getItem("token");
        const settings = {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        const response = await fetch(`${API_URL}/billing/customer/subscription/${subscriptionId}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Update Customer Subscription Error: ", error.message);
        throw error;
    }
};

const cancelCustomerSubscription = async (subscriptionId) => {
    try {
        const token = localStorage.getItem("token");
        const settings = {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        };

        const response = await fetch(`${API_URL}/billing/customer/subscription/${subscriptionId}`, settings);
        const responseJson = await response.json();
        if (response.ok) {
            return responseJson;
        }
        throw Error(responseJson.message);
    } catch (error) {
        console.log("Cancel Customer Subscription Error: ", error.message);
        throw error;
    }
};

export default {
    getAllPlans,
    createCustomer,
    updateCustomer,
    subscribeCustomerToPlan,
    getCustomerFromStripe,
    getAllCustomerInvoices,
    updateCustomerSubscription,
    cancelCustomerSubscription,
    getConversionRates,
    getCouponDetails,
};
