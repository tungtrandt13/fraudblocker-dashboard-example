import React, { useState, useCallback, useEffect, useRef } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
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
} from "@mui/material";
import styles from "./Integrations.module.scss";
import Button from "../../components/Button/Button";
import MetaAds from "../../api/MetaAds";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import ActiveDomain from "../../redux/actions/ActiveDomain";
import Account from "../../redux/actions/Account";
import MetaIcon from "../../assets/meta-ads-icon.png";
import FacebookLoginIcon from "../../assets/facebook-login.svg";
import CheckIcon from "../../assets/connected.svg";
import BlueWarningIcon from "../../assets/blue-warn.svg";
import ConnectionErrorIcon from "../../assets/google-connection-error.svg"; // Reuse the same icon - it's a generic error
import RefreshIcon from "../../assets/refresh.svg";
import Switch from "../../components/Switch/Switch";
import { FacebookLoginButton } from "react-social-login-buttons";

const customStyles = {
    subTitle: {
        marginTop: 40,
    },
    connectBtn: {
        maxWidth: 350,
        marginTop: 20,
        marginBottom: 20,
    },
    divider: {
        marginTop: 20,
        width: "100%",
        height: 1,
        backgroundColor: "#d5d9de",
    },
    invited: {
        // Not currently used, but kept for potential future use
        color: "#0caf1d",
        fontSize: "14px",
        fontWeight: "500",
        marginLeft: "10px",
    },
    fbIcon: {
        // Not currently used, consider removing if not needed
        verticalAlign: "middle",
        paddingRight: "5px",
    },
};

const MetaAdsSetup = () => {
    const [loading, setLoading] = useState({});
    const [success, setSuccess] = useState({});
    const [status, setStatus] = useState("all");
    const [adName, setAdName] = useState("");
    const [error, setError] = useState({});
    const [fbUserDetails, setFbUserDetails] = useState({}); // Not currently used, but kept in
    const [pixels, setPixels] = useState([]);
    const [adSets, setAdSets] = useState([]);
    const [areAllAdsConnected, setAreAllAdsConnected] = useState(false);
    const [filteredAdSets, setFilteredAdSets] = useState([]);
    const dispatch = useDispatch();
    const { accounts, auth, activeDomain } = useSelector((state) => state); // Use useSelector hook
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const applyFilters = useCallback(
        (adSetsList) => {
            if (!adSetsList?.length) {
                setFilteredAdSets([]); // Set to empty array if no ad sets
                return;
            }
            const filtered = adSetsList.filter((adSet) => {
                const nameMatches = (adSet.name || "").toLowerCase().includes(adName.toLowerCase());
                const statusMatches = status === "all" || (status === "connected" ? adSet.connected : !adSet.connected);
                return nameMatches && statusMatches;
            });

            setFilteredAdSets(filtered);
        },
        [adName, status]
    );

    const handleAdNameFilterChange = useCallback((e) => {
        setAdName(e.target.value);
    }, []);

    useEffect(() => {
        applyFilters(adSets);
    }, [adSets, applyFilters, adName, status]);

    const handleStatusFilterChange = useCallback((event, newStatus) => {
        if (newStatus !== null) {
            setStatus(newStatus);
        }
    }, []);

    const getAndSetCustomerAdSets = useCallback(
        async (pixelsList, accessToken, accountId, domainId, isRefreshing = false) => {
            try {
                const connectedPixels = pixelsList.filter((pix) => pix.connected === true);
                if (!connectedPixels.length) {
                    setAdSets([]);
                    setFilteredAdSets([]);
                    return;
                }

                setLoading((prevLoading) => ({
                    ...prevLoading,
                    adSets: true,
                    isRefreshing,
                }));
                setError({});
                const adSetsResult = await Promise.all(
                    connectedPixels.map((pixel) =>
                        MetaAds.getAccountAdSets(accessToken, pixel.accountId, accountId, domainId, pixel.pixelId)
                    )
                );

                // Flatten the array of arrays into a single array
                const adSetsFlattened = adSetsResult.flat();
                setAdSets(adSetsFlattened);
                applyFilters(adSetsFlattened);
                setAreAllAdsConnected(adSetsFlattened.every((ad) => ad.connected));
            } catch (error) {
                setError({ authorize: error.message });
            } finally {
                setLoading((prevLoading) => ({
                    ...prevLoading,
                    adSets: false,
                    isRefreshing: false,
                }));
            }
        },
        [applyFilters]
    );

    const getAndSetPixels = useCallback(
        async (accessToken, accountId, domainId, keepResults = false) => {
            try {
                setLoading((prevLoading) => ({
                    ...prevLoading,
                    pixels: !keepResults,
                }));

                setError((prevError) => ({
                    ...prevError,
                    pixels: "",
                }));
                const pixelsResult = await MetaAds.getPixels(accessToken, accountId, domainId);
                if (isMounted.current) {
                    // Check if the component is still mounted
                    setPixels(pixelsResult);
                }
                if (pixelsResult.length) {
                    await getAndSetCustomerAdSets(pixelsResult, accessToken, accountId, domainId);
                }
            } catch (error) {
                setError({ pixels: error.message });
            } finally {
                if (isMounted.current) {
                    // Check again before setting state
                    setLoading((prevLoading) => ({ ...prevLoading, pixels: false }));
                }
            }
        },
        [getAndSetCustomerAdSets]
    );

    const refreshAdSets = useCallback(() => {
        if (pixels.length) {
            getAndSetCustomerAdSets(
                pixels,
                activeDomain.data.meta_ads_token,
                accounts.data.id,
                activeDomain.data.id,
                true
            );
        }
    }, [pixels, activeDomain.data.meta_ads_token, accounts.data.id, activeDomain.data.id, getAndSetCustomerAdSets]);

    const getFbUserDetails = useCallback(async (accessToken, metaUserId) => {
        // Currently not used, but kept the function
        try {
            const fbUser = await MetaAds.getFbUserDetails(accessToken, metaUserId);
            if (fbUser) {
                setFbUserDetails(fbUser);
            }
        } catch (error) {
            console.error("Could not get fb user details", error.message);
        }
    }, []);

    const onFacebookLoginResponse = useCallback(
        async (response) => {
            await MetaAds.postDebug("onFacebookLoginResponse", response); // Keep this for debugging if you like

            if (response.status === "connected") {
                setError({}); // Clear previous errors
                try {
                    const authUserResult = await MetaAds.authorizeUser({
                        accessToken: response.authResponse.accessToken,
                        metaUserId: response.authResponse.userID,
                        domainId: activeDomain.data.id,
                        accountId: accounts.data.id,
                    });

                    if (authUserResult) {
                        window.Intercom("trackEvent", "connect_oauth", {
                            domain: activeDomain.data.domain_name,
                            meta: true,
                        });
                        // Fetch the latest account and update the domain
                        await dispatch(Account.fetchLatestAccount(accounts.data.id));
                        dispatch(
                            ActiveDomain.setDomainActive({
                                ...activeDomain.data,
                                meta_ads_token: authUserResult.access_token,
                                meta_user_id: response.authResponse.userID,
                            })
                        );

                        // Get pixels and ad sets
                        await getAndSetPixels(authUserResult.access_token, accounts.data.id, activeDomain.data.id);
                        await getFbUserDetails(authUserResult.access_token, response.authResponse.userID); // Optional
                    }
                } catch (error) {
                    setError({ authorize: error.message });
                }
            } else if (response.status === "unknown") {
                // Handle this case
                return;
            } else if (response.error) {
                console.error("Facebook Login Error:", response.error);
                setError({ authorize: `Facebook login failed: ${response.error}` });
            }
        },
        [accounts.data.id, activeDomain.data, getAndSetPixels, getFbUserDetails, dispatch]
    );

    useEffect(() => {
        if (accounts?.data?.id && activeDomain?.data?.id && activeDomain?.data?.meta_ads_token) {
            getAndSetPixels(activeDomain.data.meta_ads_token, accounts.data.id, activeDomain.data.id);
            getFbUserDetails(
                // Not used
                activeDomain.data.meta_ads_token,
                activeDomain.data.meta_user_id
            );
        }
    }, [
        accounts?.data?.id,
        activeDomain?.data?.id,
        activeDomain?.data?.meta_ads_token,
        getAndSetPixels,
        getFbUserDetails,
    ]);

    useEffect(() => {
        if (!activeDomain?.data) return;

        setPixels([]);
        setAdSets([]);
        setError({});
        setSuccess({});
        setLoading({});

        if (activeDomain.data.meta_ads_token) {
            getAndSetPixels(activeDomain.data.meta_ads_token, accounts.data.id, activeDomain.data.id);
            getFbUserDetails(
                // Not used
                activeDomain.data.meta_ads_token,
                activeDomain.data.meta_user_id
            );
        }
    }, [activeDomain?.data, accounts.data.id, getAndSetPixels, getFbUserDetails]);

    const disconnectPixel = useCallback(
        async (pixel) => {
            if (loading.disconnect) return;

            setLoading((prevLoading) => ({ ...prevLoading, disconnect: true }));
            setError({});

            try {
                await MetaAds.disconnectPixel(pixel.recordId);
                await getAndSetPixels(
                    // Refresh data
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id,
                    true
                );
                setSuccess({ disconnect: true });
            } catch (error) {
                console.error(error.message);
                setError({ disconnect: error.message });
            } finally {
                setLoading((prevLoading) => ({ ...prevLoading, disconnect: false }));
            }
        },
        [accounts.data?.id, activeDomain.data, getAndSetPixels, loading.disconnect]
    );

    const disconnectAdSet = useCallback(
        async (adSet) => {
            if (loading.disconnectAdSet) return;

            setLoading((prevLoading) => ({
                ...prevLoading,
                disconnectAdSet: adSet.recordId,
            }));
            setError({});

            try {
                await MetaAds.disconnectAdSet(adSet.recordId);
                await getAndSetCustomerAdSets(
                    // Refresh data
                    pixels,
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
                setSuccess({ disconnectAdSet: true });
            } catch (error) {
                console.error(error.message);
                setError({ disconnectAdSet: error.message });
            } finally {
                setLoading((prevLoading) => ({ ...prevLoading, disconnectAdSet: null }));
            }
        },
        [accounts.data?.id, activeDomain.data, pixels, getAndSetCustomerAdSets, loading.disconnectAdSet]
    );

    const disconnectDomain = useCallback(async () => {
        if (loading.disconnect) return;

        setLoading((prevLoading) => ({ ...prevLoading, disconnect: true }));
        setError({});

        try {
            // This is problematic, because window.FB might not be initialized when this function runs.
            // if you are use this function, make sure window.FB object is available
            // try {
            //     window.FB.logout(response => {
            //         console.log('Logged out from FB', response);
            //     });
            // } catch (err) {
            //     console.log('User is not in logged in state so logout is not required');
            // }

            await MetaAds.disconnectDomain(activeDomain.data.id);
            await dispatch(Account.fetchLatestAccount(accounts.data.id));
            dispatch(ActiveDomain.setDomainActive({ ...activeDomain.data, meta_ads_token: null }));
        } catch (error) {
            console.error(error.message);
            setError({ disconnectDomain: error.message });
        } finally {
            setLoading((prevLoading) => ({ ...prevLoading, disconnect: false }));
        }
    }, [accounts.data?.id, activeDomain.data, loading.disconnect, dispatch]);

    const connectPixel = useCallback(
        async (pixel) => {
            if (loading.connect) return;

            setLoading((prevLoading) => ({ ...prevLoading, connect: pixel.pixelId }));
            setError({});

            try {
                await MetaAds.connectPixel({
                    access_token: activeDomain.data.meta_ads_token,
                    account_id: accounts.data.id,
                    domain_id: activeDomain.data.id,
                    meta_pixel_id: pixel.pixelId,
                    meta_adaccount_id: pixel.accountId,
                    meta_pixel_details: pixel.details,
                });

                await getAndSetPixels(
                    // Refresh Pixel
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
                setSuccess({ connect: true });
                window.Intercom("trackEvent", "connect_adwords", {
                    domain: activeDomain.data.domain_name,
                    meta: true,
                });
            } catch (error) {
                console.error(error.message);
                // Provide more specific error handling for the "terms" error
                const errorMessage =
                    error.message.toLowerCase().includes("terms") || error.message.toLowerCase().includes("permission")
                        ? `terms-${
                              pixel.accountId.includes("act_") ? pixel.accountId.split("act_")[1] : pixel.accountId
                          }`
                        : error.message;
                setError({ connect: errorMessage });
            } finally {
                setLoading((prevLoading) => ({ ...prevLoading, connect: false }));
            }
        },
        [accounts.data?.id, activeDomain.data, getAndSetPixels, loading.connect]
    );

    const connectAdSet = useCallback(
        async (adSet) => {
            if (loading.connectAdSet) return;

            setLoading((prevLoading) => ({ ...prevLoading, connectAdSet: adSet.id }));
            setError({});

            try {
                const pixel = pixels.find((item) => item.pixelId === adSet.pixelId);
                if (!pixel) throw new Error("Pixel data not found"); // This should not happen if data integrity is maintained

                await MetaAds.connectAdSet({
                    account_id: accounts.data.id,
                    access_token: activeDomain.data.meta_ads_token,
                    audience_id: pixel.audienceId, // Use the audience ID from the found pixel
                    domain_id: activeDomain.data.id,
                    meta_pixel_id: adSet.pixelId,
                    meta_adaccount_id: adSet.accountId,
                    meta_adset_id: adSet.id,
                    meta_adset_details: adSet.details,
                });
                // Refresh data:
                await getAndSetCustomerAdSets(
                    pixels,
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
                setSuccess({ connectAdSet: true });

                window.Intercom("trackEvent", "connect_adwords", {
                    domain: activeDomain.data.domain_name,
                    meta: true,
                });
            } catch (error) {
                console.error(error.message);
                setError({ connectAdSet: error.message });
            } finally {
                setLoading((prevLoading) => ({ ...prevLoading, connectAdSet: false }));
            }
        },
        [accounts.data?.id, activeDomain.data, pixels, getAndSetCustomerAdSets, loading.connectAdSet]
    );

    const connectAllAdSets = useCallback(async () => {
        const disconnectedAdsets = adSets.filter((adSet) => !adSet.connected);

        if (loading.connectAdSet || !disconnectedAdsets.length) {
            return;
        }

        setLoading((prevLoading) => ({ ...prevLoading, connectAdSet: "all" }));
        setError({});

        try {
            const promises = disconnectedAdsets.map((adSet) => {
                const pixel = pixels.find((item) => item.pixelId === adSet.pixelId);
                if (!pixel) return Promise.resolve(null); // Skip if pixel not found
                return MetaAds.connectAdSet({
                    account_id: accounts.data.id,
                    access_token: activeDomain.data.meta_ads_token,
                    audience_id: pixel.audienceId,
                    domain_id: activeDomain.data.id,
                    meta_pixel_id: adSet.pixelId,
                    meta_adaccount_id: adSet.accountId,
                    meta_adset_id: adSet.id,
                    meta_adset_details: adSet.details,
                });
            });

            const results = await Promise.allSettled(promises);
            const errored = results.filter((result) => result.status === "rejected");

            if (errored.length < results.length) {
                await getAndSetCustomerAdSets(
                    pixels,
                    activeDomain.data.meta_ads_token,
                    accounts.data.id,
                    activeDomain.data.id
                );
                setSuccess({ connectAdSet: true });

                window.Intercom("trackEvent", "connect_adwords", {
                    domain: activeDomain.data.domain_name,
                    meta: true,
                });
            } else {
                throw new Error(errored[0]?.reason || "Failed to connect all Ad Sets"); // Access reason safely
            }
        } catch (error) {
            console.error(error.message);
            setError({ connectAdSet: error.message });
        } finally {
            setLoading((prevLoading) => ({ ...prevLoading, connectAdSet: false }));
        }
    }, [accounts.data?.id, activeDomain.data, pixels, adSets, getAndSetCustomerAdSets, loading.connectAdSet]);

    const disconnectAllAdSets = useCallback(async () => {
        const connectedAdsets = adSets.filter((adSet) => adSet.connected);
        if (loading.disconnectAdSet || !connectedAdsets.length) {
            return;
        }

        setLoading((prevLoading) => ({ ...prevLoading, disconnectAdSet: "all" }));
        setError({}); // Clear errors
        try {
            const promises = connectedAdsets.map((adSet) => MetaAds.disconnectAdSet(adSet.recordId));

            await Promise.all(promises);
            await getAndSetCustomerAdSets(
                pixels,
                activeDomain.data.meta_ads_token,
                accounts.data.id,
                activeDomain.data.id
            );
            setSuccess({ disconnectAdSet: true });
        } catch (error) {
            console.error(error.message);
            setError({ disconnectAdSet: error.message });
        } finally {
            setLoading((prevLoading) => ({ ...prevLoading, disconnectAdSet: null }));
        }
    }, [accounts.data?.id, activeDomain.data, pixels, adSets, getAndSetCustomerAdSets, loading.disconnectAdSet]);

    const openManagerDesc = useCallback(() => {
        // Not used
        setShowMangerDesc((prevShowMangerDesc) => !prevShowMangerDesc);
    }, []);

    const connected = activeDomain?.data?.meta_ads_token;

    return (
        <Box className={styles.content}>
            <Typography variant="h1" className={styles.title}>
                Meta Ads Setup
            </Typography>
            <Typography paragraph>
                In order for us to block the fraudulent users coming from your Facebook and Instagram campaigns, you
                will need to provide us access to your Meta Ads account. By doing so, we will add those users to an
                audience list which will be excluded from the Ad Sets you select.
            </Typography>
            <Typography paragraph className={styles.metaNote}>
                <img src={BlueWarningIcon} alt="Warning" className={styles.warningIcon} />
                <strong> Connection Requirements - </strong>These items are required before proceeding:
                <ul className={styles.metaChecklist}>
                    <li>
                        A <strong>Meta Business Account - </strong>You can only connect to ad accounts that belong to a
                        Meta Business Account; you can't link personal ad accounts. Instructions to create a Meta
                        Business Account are{" "}
                        <Link
                            href="https://www.facebook.com/business/help/1710077379203657?id=180505742745347"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            here
                        </Link>
                        .
                    </li>
                    <li>
                        A <strong>Meta Pixel - </strong>You must have a Meta Pixel on your website. Instructions to
                        create a Meta Pixel are{" "}
                        <Link
                            href="https://www.facebook.com/business/help/952192354843755"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            here
                        </Link>
                        .
                    </li>
                </ul>
            </Typography>

            {!connected && (
                <>
                    <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                        Connect Meta Ads
                    </Typography>
                    <Typography paragraph>
                        Sign in to your Meta Ads account. You will then be directed to select a Pixel and Ad Set(s).
                    </Typography>
                    <Box className={styles.googleLoginContainer}>
                        <FacebookLoginButton
                            onClick={() =>
                                window.FB.login(onFacebookLoginResponse, {
                                    config_id: process.env.REACT_APP_FACEBOOK_CONFIG_ID, // Use the config ID from .env
                                })
                            }
                        >
                            <img
                                src={FacebookLoginIcon}
                                alt="fb-icon"
                                style={{ marginRight: "10px", width: "14px", height: "14px" }}
                            />
                            <span>Sign In With Facebook</span>
                        </FacebookLoginButton>
                    </Box>
                    {error.authorize && <ErrorBox error={error.authorize} />}
                </>
            )}

            {connected && (
                <>
                    <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                        Connect Meta Ads
                    </Typography>
                    <Typography paragraph>
                        Sign in to your Meta Ads account. You will then be directed to select a Pixel and Ad Set(s).
                    </Typography>
                    <Box className={`${styles.googleLoginContainer} ${styles.linkDifferent}`}>
                        {/*  Use FacebookLoginButton, onClick call window.FB.login() */}
                        <FacebookLoginButton
                            onClick={() =>
                                window.FB.login(onFacebookLoginResponse, {
                                    config_id: process.env.REACT_APP_FACEBOOK_CONFIG_ID, // Use the config ID from .env
                                })
                            }
                        >
                            <img
                                src={FacebookLoginIcon}
                                alt="fb-icon"
                                style={{ marginRight: "10px", width: "14px", height: "14px" }}
                            />
                            <span>Link a Different Account</span>
                        </FacebookLoginButton>

                        {fbUserDetails &&
                            false && ( // This part seems unused based on your provided code, so I've kept it commented out
                                <Box className={styles.fbUserDetails}>
                                    {fbUserDetails.picture && (
                                        <Box
                                            className={styles.fbUserPhoto}
                                            sx={{
                                                backgroundImage: `url(${fbUserDetails.picture.url})`,
                                            }}
                                        />
                                    )}
                                    <Box className={styles.fbNameAndPage}>
                                        {fbUserDetails.name && (
                                            <Typography className={styles.fbUserName}>
                                                <strong>{fbUserDetails.name}</strong>
                                            </Typography>
                                        )}
                                        {fbUserDetails.pages && fbUserDetails.pages.length && (
                                            <Typography className={styles.fbUserPages}>
                                                <strong>Active Pages:</strong>{" "}
                                                {fbUserDetails.pages.map((page) => page.name)}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                    </Box>
                    {error.authorize && <ErrorBox error={error.authorize} />}

                    {!error.pixels && (
                        <>
                            <Box className={styles.accountsHeader}>
                                <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                                    Select Pixel <span className={styles.required}>(Required)</span>
                                    <Typography className={styles.pixelDescription}>
                                        Select Facebook pixel(s) associated with your account.
                                    </Typography>
                                </Typography>
                            </Box>
                            {pixels.length > 0 &&
                                pixels.map((pixel, index) => (
                                    <Box
                                        className={loading.connect === pixel.pixelId ? styles.fadingIn : ""}
                                        key={pixel.pixelId}
                                        sx={{
                                            animationDelay:
                                                loading.connect === pixel.pixelId ? "0.3s" : `${(index + 1) * 0.3}s`,
                                        }}
                                    >
                                        <Box className={styles.connectedWrap}>
                                            <img src={MetaIcon} alt="meta icon" width={42} height={21} />
                                            <Box className={styles.connectedText}>
                                                <Typography className={styles.connectedEmail}>
                                                    {pixel.pixelName}
                                                </Typography>
                                            </Box>
                                            {pixel.connected ? (
                                                <Box className={styles.connectedRight}>
                                                    <Box className={styles.connectedBtn}>
                                                        <img src={CheckIcon} alt="connected" />
                                                        Connected
                                                    </Box>
                                                    <Box className={styles.disconnectWrap}>
                                                        <Button
                                                            variant="text"
                                                            color="primary"
                                                            onClick={() => disconnectPixel(pixel)}
                                                            className={styles.disconnectBtn}
                                                        >
                                                            {loading.disconnect ? "Removing..." : "Remove This Pixel"}
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => connectPixel(pixel)}
                                                    className={styles.connectBtn}
                                                >
                                                    {loading.connect === pixel.pixelId ? (
                                                        <CircularProgress size={24} color="inherit" />
                                                    ) : (
                                                        "Connect This Pixel"
                                                    )}
                                                </Button>
                                            )}
                                        </Box>
                                        <Box sx={customStyles.divider} />
                                    </Box>
                                ))}
                            {pixels.length === 0 && !loading.pixels && (
                                <Box className={styles.pixelsError}>
                                    <img src={ConnectionErrorIcon} alt="Error" />
                                    No pixel found. Please &nbsp;
                                    <Link
                                        href="https://www.facebook.com/business/help/952192354843755"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        create a pixel
                                    </Link>
                                    &nbsp; in your &nbsp; <strong>Meta Business Account</strong>
                                </Box>
                            )}
                        </>
                    )}
                </>
            )}

            {connected && adSets.length > 0 && (
                <>
                    <Box className={`${styles.accountsHeader} ${styles.metaAccountsHeader}`}>
                        <Box component="section" className={styles.adsHeader}>
                            <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                                Select Ad Set <span className={styles.required}>(Required)</span>
                                <Typography className={styles.pixelDescription}>
                                    Select the Ad Set(s) you’d like to protect. Note: Meta will place your ads back into
                                    review.{" "}
                                    <Link
                                        href="https://help.fraudblocker.com/en/articles/9043929-how-do-i-connect-my-facebook-ads-meta-ads-account"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Read more.
                                    </Link>
                                </Typography>
                            </Typography>
                            <Box className={styles.refreshAds} onClick={refreshAdSets}>
                                Refresh Ad Sets{" "}
                                <img
                                    className={loading.isRefreshing ? styles.refreshing : ""}
                                    src={RefreshIcon}
                                    alt="refresh"
                                />
                            </Box>
                        </Box>
                        <Box className={styles.searchWrap}>
                            Filter
                            <TextField
                                placeholder="Ad Set Name"
                                onChange={handleAdNameFilterChange}
                                value={adName}
                                name="ad_set_filter"
                                variant="standard"
                                sx={{ ml: 1 }}
                            />
                            <ToggleButtonGroup
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
                            <Box className={styles.connectAll}>
                                {areAllAdsConnected ? "Disconnect All" : "Connect All"}{" "}
                                <Switch
                                    checked={areAllAdsConnected}
                                    onChange={() => (!areAllAdsConnected ? connectAllAdSets() : disconnectAllAdSets())}
                                    disabled={loading.connectAdSet || loading.disconnectAdSet}
                                    onColor="#17D384"
                                    inputProps={{ "aria-label": "controlled" }}
                                />
                            </Box>
                        </Box>
                    </Box>
                    {filteredAdSets.map((client, index) => (
                        <Box
                            className={
                                loading.connectAdSet === client.id || loading.connectAdSet === "all"
                                    ? styles.fadingIn
                                    : ""
                            }
                            key={client.id}
                            sx={{
                                animationDelay:
                                    loading.connectAdSet === client.id || loading.connectAdSet === "all"
                                        ? "0.3s"
                                        : `${(index + 1) * 0.3}s`,
                            }}
                        >
                            <Box className={styles.connectedWrap}>
                                <img src={MetaIcon} alt="meta icon" width={42} height={21} />
                                <Box className={styles.connectedText}>
                                    <Typography className={styles.connectedEmail}>{client.name}</Typography>
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
                                                onClick={() => disconnectAdSet(client)}
                                                className={styles.disconnectBtn}
                                            >
                                                {loading.disconnectAdSet === client.recordId ||
                                                loading.disconnectAdSet === "all"
                                                    ? "Disconnecting..."
                                                    : "Disconnect This Ad Set"}
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => connectAdSet(client)}
                                        className={styles.connectBtn}
                                    >
                                        {loading.connectAdSet === client.id || loading.connectAdSet === "all" ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            "Connect This Ad Set"
                                        )}
                                    </Button>
                                )}
                            </Box>
                            <Box sx={customStyles.divider} />
                        </Box>
                    ))}
                </>
            )}

            {loading.pixels && (
                <Box className={`${styles.clientsLoader} ${styles.fadingIn}`}>
                    <CircularProgress color="primary" />
                </Box>
            )}

            {loading.adSets && adSets.length === 0 && (
                <Box className={`${styles.clientsLoader} ${styles.fadingIn}`}>
                    <CircularProgress color="primary" />
                </Box>
            )}
            {error.connect && !error.connect.includes("terms") && <ErrorBox error={error.connect} />}
            {error.connect && error.connect.includes("terms") && (
                <Alert severity="warning">
                    Please accept &nbsp;
                    <Link
                        href={`https://business.facebook.com/ads/manage/customaudiences/tos/?business_id=${
                            error.connect.split("-")[1]
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="primary"
                    >
                        Meta's terms and conditions
                    </Link>
                    &nbsp; for custom audiences. Problems ? &nbsp;
                    <Link
                        href="https://help.fraudblocker.com/en/articles/10046374-accepting-meta-s-terms-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="primary"
                    >
                        Change profiles.
                    </Link>
                </Alert>
            )}

            {error.connectAdSet && <ErrorBox error={error.connectAdSet} />}
            {error.disconnect && <ErrorBox error={error.disconnect} />}
            {error.disconnectAdSet && <ErrorBox error={error.disconnectAdSet} />}

            {connected &&
                error.pixels &&
                (error.pixels.toLowerCase().includes("business") ? (
                    <Box className={styles.pixelsError}>
                        <img src={ConnectionErrorIcon} alt="Error" />
                        No Meta Business Account was found. Please &nbsp;
                        <Link
                            href="https://www.facebook.com/business/tools/meta-business-suite"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            create a Business Account
                        </Link>
                        .
                    </Box>
                ) : (
                    <Box className={styles.pixelsError}>
                        <img src={ConnectionErrorIcon} alt="Error" />
                        {error.pixels}
                    </Box>
                ))}

            <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                Why We Need This
            </Typography>
            <Typography paragraph>
                By providing us access to your Facebook account, we create an audience group that is then excluded from
                your Meta Ads account. Without this access you will be unable to automatically block bad clicks from
                your account. Our software does not edit or change any other elements of your Meta Ads campaigns.
            </Typography>

            <Typography variant="h3" sx={customStyles.subTitle} className={styles.subTitle}>
                About Your Security
            </Typography>
            <Typography paragraph>
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

MetaAdsSetup.propTypes = {
    accounts: PropTypes.object,
    auth: PropTypes.object,
    activeDomain: PropTypes.object,
    setDomain: PropTypes.func,
    fetchLatestAccount: PropTypes.func,
};

export default MetaAdsSetup;
