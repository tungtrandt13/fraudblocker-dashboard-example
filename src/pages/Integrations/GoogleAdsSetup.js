import React, { useState, useCallback, useEffect, useRef } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom"; // Use RouterLink
import PropTypes from "prop-types";
import {
    Box,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    CircularProgress,
    Link,
    Alert,
    InputAdornment,
    IconButton,
} from "@mui/material";
import GoogleLogin from "react-google-login";
import styles from "./Integrations.module.scss";
import Button from "../../components/Button/Button";
import ConfirmAccountDisconnectionModal from "../../containers/ConfirmAccountDisconnectionModal/ConfirmAccountDisconnectionModal";
import GoogleAds from "../../api/GoogleAds";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import ActiveDomain from "../../redux/actions/ActiveDomain";
import Account from "../../redux/actions/Account";
import DriveIcon from "../../assets/googleconnected.svg";
import ArrowRight from "../../assets/dropdown-arrow.svg"; // Keep, but we might style differently
import CheckIcon from "../../assets/connected.svg";
import ConnectionErrorIcon from "../../assets/google-connection-error.svg";
import GoogleIcon from "../../assets/google-logo.svg";
import Input from "../../components/Input/Input"; // Keep this for now, but will replace with TextField

const customStyles = {
    subTitle: {
        marginTop: 40,
    },
    connectBtn: {
        maxWidth: 350,
        marginTop: 20,
        marginBottom: 20,
    },
    removeConnectionGrayButton: {
        border: "none",
        background: "transparent",
        color: "#7e7e7e",
        fontWeight: "normal",
    },
    divider: {
        marginTop: 20,
        width: "100%",
        height: 1,
        backgroundColor: "#d5d9de",
    },
    invited: {
        color: "#0caf1d",
        fontSize: "14px",
        fontWeight: "500",
        marginLeft: "10px",
    },
    // Consider removing or replacing with MUI styles
    mccInput: {
        width: "90px",
        height: "36px",
        fontSize: "14px",
        fontWeight: "normal",
        textAlign: "center",
        paddingLeft: "18px",
        paddingRight: "18px",
    },
};

const GoogleAdsSetup = () => {
    const [loading, setLoading] = useState({});
    const [success, setSuccess] = useState({});
    const [status, setStatus] = useState("all");
    const [email, setEmail] = useState("");
    const [accountName, setAccountName] = useState("");
    const [error, setError] = useState({});
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [invited, setInvited] = useState(false);
    const [managerAccountId, setManagerAccountId] = useState("");
    const [showMangerDesc, setShowMangerDesc] = useState(false);
    const [disconnectingAds, setDisconnectingAds] = useState(false);
    const [showAdDisconnectConfirmation, setShowAdDisconnectConfirmation] = useState(null);
    const [showConnectionRemoveConfirmation, setShowConnectionRemoveConfirmation] = useState(false);

    const dispatch = useDispatch();
    const { accounts, auth, activeDomain } = useSelector((state) => state); // Use useSelector
    const inputRef = useRef(null);

    const sendInvitation = useCallback(async () => {
        if (!managerAccountId || !activeDomain?.data?.id) {
            return;
        }
        setLoading((prevLoading) => ({ ...prevLoading, manager: true }));
        setError({}); // Clear previous errors

        try {
            const inviteResult = await GoogleAds.inviteManagerAccount({
                managerId: managerAccountId.replace(/-/g, ""),
                domainId: activeDomain.data.id,
            });
            console.log("Invitation Result", inviteResult);
            setInvited(true);
        } catch (error) {
            setError({ manager: error.message });
        } finally {
            setLoading((prevLoading) => ({ ...prevLoading, manager: false }));
        }
    }, [managerAccountId, activeDomain?.data?.id]);

    const handleManagerAccountChange = useCallback((e) => {
        setManagerAccountId(e.target.value);
    }, []);

    const handleEmailChange = useCallback((e) => {
        setEmail(e.target.value);
    }, []);

    const applyFilters = useCallback(
        (clientsList) => {
            if (!clientsList.length) {
                setFilteredClients([]);
                return;
            }

            const filtered = clientsList.filter((client) => {
                const nameMatches = (client.customerClient.descriptiveName || "")
                    .toLowerCase()
                    .includes(accountName.toLowerCase());
                const statusMatches =
                    status === "all" || (status === "connected" ? client.connected : !client.connected);
                return nameMatches && statusMatches;
            });
            setFilteredClients(filtered);
        },
        [accountName, status]
    );

    const handleAccountNameFilterChange = useCallback((e) => {
        setAccountName(e.target.value);
    }, []);

    useEffect(() => {
        applyFilters(clients);
    }, [clients, applyFilters, accountName, status]);

    const handleStatusFilterChange = useCallback((event, newStatus) => {
        if (newStatus !== null) {
            setStatus(newStatus);
        }
    }, []);

    const getAndSetCustomerClients = useCallback(
        async (accountId, domainId) => {
            setLoading((prevLoading) => ({ ...prevLoading, clients: true }));
            setError({}); // Clear previous errors

            try {
                const clientsResult = await GoogleAds.getCustomerClients(accountId, domainId);
                console.log("Connected Clients", clientsResult);
                setClients(clientsResult);
                applyFilters(clientsResult);
            } catch (error) {
                setError({ authorize: error.message });
            } finally {
                setLoading((prevLoading) => ({ ...prevLoading, clients: false }));
            }
        },
        [applyFilters]
    );

    const onGoogleLoginResponse = useCallback(
        async (response) => {
            if (response.code) {
                setError({});
                try {
                    const authUserResult = await GoogleAds.authorizeUser(
                        response.code,
                        activeDomain.data.id,
                        accounts.data.id
                    );
                    if (authUserResult) {
                        window.Intercom("trackEvent", "connect_oauth", {
                            domain: activeDomain.data.domain_name,
                        });

                        await dispatch(Account.fetchLatestAccount(accounts.data.id));
                        dispatch(
                            ActiveDomain.setDomainActive({
                                ...activeDomain.data,
                                google_ads_token: authUserResult.refresh_token,
                            })
                        );
                        await getAndSetCustomerClients(accounts.data.id, activeDomain.data.id);
                    }
                } catch (error) {
                    setError({ authorize: error.message });
                }
            }
            if (response.error) {
                console.error("Google Login Error:", response.error); // Log the error
                // Consider setting a user-friendly error message in the state.
                setError({ authorize: `Google login failed: ${response.error}` }); // Set a more descriptive error
            }
        },
        [accounts.data.id, activeDomain.data.domain_name, activeDomain.data.id, getAndSetCustomerClients, dispatch]
    );

    useEffect(() => {
        if (accounts?.data?.id && activeDomain?.data?.id && activeDomain?.data?.google_ads_token) {
            getAndSetCustomerClients(accounts.data.id, activeDomain.data.id);
        }
    }, [accounts?.data?.id, activeDomain?.data?.id, activeDomain?.data?.google_ads_token, getAndSetCustomerClients]);

    useEffect(() => {
        if (activeDomain?.data && activeDomain?.data?.id) {
            setClients([]);
            setError({});
            setSuccess({});
            setLoading({});
            if (activeDomain.data.google_ads_token) {
                getAndSetCustomerClients(accounts.data.id, activeDomain.data.id);
            }
        }
    }, [activeDomain?.data, accounts.data.id, getAndSetCustomerClients]);

    const testGoogleAdsIntegration = useCallback(async () => {
        setLoading((prevLoading) => ({ ...prevLoading, test: true }));
        setError({});
        setSuccess({});

        try {
            const result = await GoogleAds.testGoogleAdsIntegration(activeDomain.data.id);
            if (result === "Unauthorized") {
                await GoogleAds.refreshAccessToken(activeDomain.data.id);
                // Retry the integration test after refreshing the token
                return testGoogleAdsIntegration(); // Recursive call.  Careful with these!
            } else {
                const { resourceNames } = result;
                if (resourceNames) {
                    setSuccess({ test: true });
                } else {
                    throw new Error(`No Accounts found.`);
                }
            }
        } catch (error) {
            console.error(error.message);
            setError({ test: error.message });
        } finally {
            setLoading((prevLoading) => ({ ...prevLoading, test: false }));
        }
    }, [activeDomain?.data?.id]);

    const disconnectClient = useCallback(
        async (clientRecordId) => {
            if (loading.disconnect) {
                return;
            }
            setLoading((prevLoading) => ({ ...prevLoading, disconnect: true }));
            setError({}); // Clear errors

            try {
                await GoogleAds.disconnectClient(clientRecordId);
                // Instead of artificial delay, refetch the clients list
                await getAndSetCustomerClients(accounts.data.id, activeDomain.data.id);
                setSuccess({ disconnect: true }); // Set after successful operation
            } catch (error) {
                console.error(error.message);
                setError({ disconnect: error.message });
            } finally {
                setLoading((prevLoading) => ({ ...prevLoading, disconnect: false }));
                setShowAdDisconnectConfirmation(false);
            }
        },
        [accounts.data?.id, activeDomain?.data?.id, getAndSetCustomerClients, loading.disconnect]
    );

    const disconnectDomain = useCallback(async () => {
        if (loading.disconnect) {
            return;
        }
        setLoading((prevLoading) => ({ ...prevLoading, disconnect: true }));
        setError({}); // Clear errors
        try {
            await GoogleAds.disconnectDomain(activeDomain.data.id);
            await dispatch(Account.fetchLatestAccount(accounts.data.id));

            dispatch(
                ActiveDomain.setDomainActive({ ...activeDomain.data, google_ads_token: null, google_email: null })
            );
        } catch (error) {
            console.error(error.message);
            setError({ disconnectDomain: error.message });
        } finally {
            setLoading((prevLoading) => ({ ...prevLoading, disconnect: false }));
        }
    }, [accounts.data?.id, activeDomain.data, loading.disconnect, dispatch]);

    const disconnectGoogleAds = useCallback(
        async (clearConnection = false) => {
            if (loading.disconnectingAds) {
                return;
            }
            setLoading((prevLoading) => ({ ...prevLoading, disconnectingAds: true }));
            setError({});
            try {
                if (clearConnection) {
                    await GoogleAds.clearConnection(activeDomain.data.id);
                } else {
                    await GoogleAds.disconnectGoogleAds(email || auth.user.email); // Use the state email
                }

                await dispatch(Account.fetchLatestAccount(accounts.data.id));

                if (clearConnection) {
                    dispatch(
                        ActiveDomain.setDomainActive({
                            ...activeDomain.data,
                            google_ads_token: null,
                            google_email: null,
                            oauth_problem: false,
                            mcc_manager_id: null,
                            mcc_link_id: null,
                        })
                    );
                } else {
                    dispatch(
                        ActiveDomain.setDomainActive({
                            ...activeDomain.data,
                            google_ads_token: null,
                            google_email: null,
                        })
                    );
                }
                setShowConnectionRemoveConfirmation(false);
            } catch (error) {
                console.error(error.message);
                setError({ disconnectDomain: error.message });
            } finally {
                setLoading((prevLoading) => ({ ...prevLoading, disconnectingAds: false }));
            }
        },
        [activeDomain.data, loading.disconnectingAds, email, auth.user?.email, dispatch]
    );

    const redirectToDomain = useCallback(
        (domainId) => {
            const domain = accounts.data.domains.find((dom) => dom.id === domainId);
            if (domain) {
                dispatch(ActiveDomain.setDomainActive(domain));
            }
        },
        [accounts.data?.domains, dispatch]
    );

    const connectAccount = useCallback(
        async (client) => {
            if (loading.connect) {
                return;
            }
            setLoading((prevLoading) => ({
                ...prevLoading,
                connect: `<span class="math-inline">\{client\.customerClient\.id\}</span>{client.managerId}`,
            }));
            setError({}); // Clear errors

            try {
                await GoogleAds.connectClient({
                    customer_account: client.customerClient,
                    account_id: accounts.data.id,
                    domain_id: activeDomain.data.id,
                    customer_id: client.customerId,
                    manager_id: client.managerId,
                });
                // Instead of a timeout, fetch the updated client list
                await getAndSetCustomerClients(accounts.data.id, activeDomain.data.id);
                setSuccess({ connect: true }); // Set after successful operation

                window.Intercom("trackEvent", "connect_adwords", {
                    domain: activeDomain.data.domain_name,
                });
            } catch (error) {
                console.error(error.message);
                // More specific error handling. Check for the "already connected" case.
                const errorMessage = error.message.includes("already") ? (
                    <>
                        This Google Ads Account is already connected to another domain name{" "}
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => redirectToDomain(error.message.split("domainId:")[1])}
                        >
                            here
                        </Link>
                        . Please select a different account.
                    </>
                ) : (
                    error.message
                );
                setError({ connect: errorMessage });
            } finally {
                setLoading((prevLoading) => ({ ...prevLoading, connect: false }));
            }
        },
        [accounts.data?.id, activeDomain.data, getAndSetCustomerClients, loading.connect, redirectToDomain]
    );

    const openManagerDesc = useCallback(() => {
        setShowMangerDesc((prevShowMangerDesc) => !prevShowMangerDesc);
    }, []);

    const toggleAdDisconnectionConfirmation = useCallback((clientRecordId = null) => {
        setShowAdDisconnectConfirmation(clientRecordId);
    }, []);

    const toggleConnectionRemovalConfirmation = useCallback(() => {
        setShowConnectionRemoveConfirmation(
            (prevShowConnectionRemoveConfirmation) => !prevShowConnectionRemoveConfirmation
        );
    }, []);

    const connected = activeDomain?.data?.google_ads_token;

    return (
        <Box className={styles.content}>
            <Typography variant="h1" className={styles.title}>
                Google Ads Setup
            </Typography>
            <Typography>
                In order for us to block the fraudulent clicks coming from your Google Ads campaigns, you will need to
                provide us access to your Google Ads account so we can import any fraudulent IP addresses in real time.
            </Typography>
            <br />

            {!connected && (
                <>
                    <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                        Connect Google Ads
                    </Typography>
                    <Typography>
                        Press the button below to send a request to Google Ads for us to access your account.
                    </Typography>
                    <Box className={styles.googleLoginContainer}>
                        <GoogleLogin
                            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
                            scope="https://www.googleapis.com/auth/adwords"
                            theme="dark"
                            responseType="code"
                            accessType="offline"
                            redirectUri={`${process.env.REACT_APP_HOST}/integrations/google-ads-setup`}
                            onSuccess={onGoogleLoginResponse}
                            onFailure={onGoogleLoginResponse}
                            render={(renderProps) => (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    customClassNames={styles.googleButton} // Keep any custom styling you need
                                    onClick={renderProps.onClick}
                                    disabled={renderProps.disabled}
                                    startIcon={
                                        <img src={GoogleIcon} alt="google-icon" style={{ marginRight: "8px" }} />
                                    }
                                >
                                    Sign In With Google
                                </Button>
                            )}
                        />
                    </Box>
                    {error.authorize && !error.authorize.includes("Refresh token not available") && (
                        <ErrorBox error={error.authorize} />
                    )}
                </>
            )}

            {((connected && clients.length === 0 && !loading.clients && !error.connect) ||
                (error.authorize &&
                    (error.authorize.includes("Refresh token not available") ||
                        error.authorize.includes("no customers")))) && (
                <>
                    <Typography variant="h3" sx={customStyles.subTitle} className={styles.errorMessageTitle}>
                        <img src={ConnectionErrorIcon} alt="warning" className={styles.connectionErrorIcon} />
                        There is an issue with your Google Ads connection
                    </Typography>
                    {error.authorize && error.authorize.includes("no customers") ? (
                        <Typography>
                            This Google Ads account does not have any campaigns created. Please remove your connection
                            and sign in to a different Google Ads account.
                        </Typography>
                    ) : (
                        <Typography>
                            We were unable to fetch your Google Ads customer account with the authorization provided.
                            This means that we cannot sync your blocked IPs to your campaigns. This may have been any
                            issue with your cache. Please remove your connection and try again.
                        </Typography>
                    )}
                    <Button
                        variant="outlined"
                        color="error"
                        customClassNames={styles.removeConnectionBtn}
                        onClick={() => disconnectGoogleAds(true)}
                        disabled={loading.disconnectingAds}
                    >
                        {loading.disconnectingAds ? "Removing..." : "Remove Connection"}
                    </Button>
                    <Typography sx={{ marginBottom: "20px" }}>
                        Still have trouble ?{" "}
                        <Link
                            href="https://fraudblocker.com/contact-us"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.blueLink}
                        >
                            Contact us.
                        </Link>
                    </Typography>
                    {error.disconnectDomain && <ErrorBox error={error.disconnectDomain} />}
                </>
            )}

            {!loading.clients && connected && clients.length > 0 && (
                <>
                    <Box className={styles.accountsHeader}>
                        <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                            Available Accounts
                        </Typography>
                        <Box className={styles.searchWrap}>
                            <TextField
                                placeholder="Account Name"
                                onChange={handleAccountNameFilterChange}
                                value={accountName}
                                variant="outlined"
                                size="small"
                            />
                            <ToggleButtonGroup
                                className={styles.filtersToggleGroup}
                                color="primary"
                                value={status}
                                exclusive
                                onChange={handleStatusFilterChange}
                                aria-label="Status"
                            >
                                <ToggleButton value="all">Show All</ToggleButton>
                                <ToggleButton value="connected">Connected</ToggleButton>
                                <ToggleButton value="disconnected">Not Connected</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>
                    {filteredClients.map((client, index) => (
                        <Box
                            className={
                                loading.connect === `${client.customerClient.id}${client.managerId}`
                                    ? styles.fadingIn
                                    : ""
                            }
                            key={`${client.customerClient.id}${client.managerId}`}
                            sx={{
                                animationDelay:
                                    loading.connect === `${client.customerClient.id}${client.managerId}`
                                        ? "0.3s"
                                        : `${(index + 1) * 0.3}s`,
                            }}
                        >
                            <Box className={styles.connectedWrap}>
                                <img src={DriveIcon} alt="drive icon" className={styles.driveIcon} />
                                <Box className={styles.connectedText}>
                                    <Typography className={styles.connectedEmail}>
                                        {client.customerClient.descriptiveName}
                                    </Typography>
                                    <Typography className={styles.connected}>
                                        {client.id || client.customerClient.id}
                                    </Typography>
                                </Box>
                                {client.connected ? (
                                    <Box className={styles.connectedRight}>
                                        <Box className={styles.connectedBtn}>
                                            <img src={CheckIcon} alt="connected" />
                                            Connected
                                        </Box>
                                        <Box className={styles.disconnectWrap}>
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => toggleAdDisconnectionConfirmation(client.recordId)}
                                                className={styles.disconnectBtn}
                                            >
                                                {loading.disconnect ? "Disconnecting..." : "Disconnect This Account"}
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => connectAccount(client)}
                                        className={styles.connectBtn}
                                    >
                                        {loading.connect === `${client.customerClient.id}${client.managerId}` ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            "Connect This Account"
                                        )}
                                    </Button>
                                )}
                            </Box>
                            <Box sx={customStyles.divider} />
                        </Box>
                    ))}

                    {/* For logged in user so that they can reset the connection */}
                    <Box className={styles.removeConnectionBlock}>
                        <Button
                            variant="text"
                            color="inherit"
                            onClick={toggleConnectionRemovalConfirmation}
                            disabled={loading.disconnectingAds}
                            type="button"
                        >
                            Remove Google Account
                        </Button>
                    </Box>
                </>
            )}

            {loading.clients && (
                <Box className={`${styles.clientsLoader} ${styles.fadingIn}`}>
                    <CircularProgress color="primary" />
                </Box>
            )}

            {showAdDisconnectConfirmation && (
                <ConfirmAccountDisconnectionModal
                    isLoading={loading.disconnect}
                    type="google"
                    isAll={false}
                    recordId={showAdDisconnectConfirmation}
                    onConfirm={disconnectClient}
                    onCancel={toggleAdDisconnectionConfirmation}
                />
            )}

            {showConnectionRemoveConfirmation && (
                <ConfirmAccountDisconnectionModal
                    isLoading={loading.disconnectingAds}
                    type="google"
                    isAll={true}
                    onConfirm={disconnectGoogleAds}
                    onCancel={toggleConnectionRemovalConfirmation}
                />
            )}

            {error.connect && <ErrorBox error={error.connect} />}
            {error.disconnect && <ErrorBox error={error.disconnect} />}
            {error.connect && (
                <Box className={styles.disconnectWrap}>
                    <Button
                        variant="text"
                        color="primary"
                        onClick={() => disconnectDomain()}
                        className={styles.disconnectBtn}
                        sx={{ marginLeft: 0 }}
                    >
                        {loading.disconnect ? "Removing" : "Remove"} Google oAuth Connection
                    </Button>
                </Box>
            )}
            {error.connect && error.disconnectDomain && <ErrorBox error={error.disconnectDomain} />}

            {/* visible to the god mode only */}
            {auth.user &&
                auth.user.id === "jqsRU2kZc4R2UKXtp88QCLnwUUp1" && ( //TODO: need change id
                    <Box>
                        <Typography variant="h4">Delete Google Ads Data</Typography>
                        <Box
                            sx={{
                                display: "flex",
                                width: "300px",
                                marginTop: "20px",
                                marginBottom: "20px",
                            }}
                        >
                            <TextField
                                onChange={handleEmailChange}
                                value={email}
                                type="text"
                                placeholder="Email"
                                variant="outlined"
                                size="small"
                                sx={{ mr: 1 }}
                            />
                            <Button
                                variant="contained"
                                color="error"
                                onClick={disconnectGoogleAds}
                                disabled={!email || loading.disconnectingAds}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                sx={{ ml: 1, minWidth: "280px" }}
                                onClick={disconnectDomain}
                                disabled={loading.disconnect}
                            >
                                Delete Google Ads Data (domain level)
                            </Button>
                        </Box>
                        <Typography>
                            The Delete button will delete the oAuth email and the Google Ads Account numbers for all
                            domain names under the email account provided.
                        </Typography>
                    </Box>
                )}

            <Box className={styles.managerAdsSec}>
                <Box className={styles.secHeading} onClick={openManagerDesc}>
                    For“ Manager” Accounts(“MCC”)
                    <Box component="span" className={`${styles.icon} ${showMangerDesc ? "active" : ""}`}>
                        <img
                            src={ArrowRight}
                            alt="arrow"
                            style={{
                                transform: showMangerDesc ? "rotate(90deg)" : "rotate(0deg)", // Rotate based on state
                                transition: "transform 0.3s ease",
                            }}
                        />
                    </Box>
                </Box>
                <Box className={`${styles.managerAdsDesc} ${showMangerDesc ? "active" : ""}`}>
                    <Box className={styles.managerAdsInner}>
                        <Typography>
                            You must first join our Manager Account before you can connect to your customer accounts.
                            Please send and invite by entering your MCC Account number below.
                        </Typography>
                        <Box className={styles.mangerAccountForm}>
                            <TextField
                                label="MCC Account Number"
                                variant="outlined"
                                onChange={handleManagerAccountChange}
                                value={managerAccountId}
                                placeholder="000-000-0000"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="send invite"
                                                onClick={sendInvitation}
                                                disabled={loading.manager || invited}
                                                edge="end"
                                            >
                                                {loading.manager ? <CircularProgress size={24} /> : "Send"}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {invited && <Typography sx={customStyles.invited}>✓ Invitation Sent</Typography>}
                        </Box>
                        {error.manager && <ErrorBox error={error.manager} />}
                        <Typography className={styles.noMargin}>
                            Next, accept the invite by going to your MCC Account (instructions are available &nbsp;
                            <Link
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://help.fraudblocker.com/en/collections/1818202-help-and-answers"
                            >
                                here
                            </Link>
                            )<br />
                            Once accepted, press the &quot;Sign in with Google&quot; button and select the Google Ads
                            account you wish to connect to.
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                Why We Need This
            </Typography>
            <Typography>
                By providing us access to your Google Ads account, we can import any fradulent IP Addresses we detect
                directly to your Google Ads account in real time. Without this access you will be unable to
                automatically block bad clicks from your account. Our software does not not edit or change any other
                elements of your Google Ad campaigns.
            </Typography>

            <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                About Your Security
            </Typography>
            <Typography>
                Our mission is to protect our clients from the rampant ad fraud occurring on the internet today. We also
                aim to provide more transparency with our service with access to detailed fraud reporting and analytics.
                We have taken steps and put security measures in place to prevent the accidental loss or misuse of
                personal data, and will take all steps possible to make sure that your personal data is encrypted and
                stored securely. You can read more about our security methods in our{" "}
                <Link href="https://fraudblocker.com/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                </Link>
                .
            </Typography>
        </Box>
    );
};

GoogleAdsSetup.propTypes = {
    accounts: PropTypes.object,
    auth: PropTypes.object,
    activeDomain: PropTypes.object,
    setDomain: PropTypes.func,
    fetchLatestAccount: PropTypes.func,
};

export default GoogleAdsSetup;
