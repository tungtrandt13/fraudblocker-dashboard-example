const API_URL =
    process.env.NODE_ENV === "development"
        ? "https://mock.apidog.com/m1/819889-799279-default/api"
        : "https://backend.fraudblocker.com/api";

export default API_URL;
