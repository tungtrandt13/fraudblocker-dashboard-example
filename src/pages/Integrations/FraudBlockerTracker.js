import React, { useState, useRef, useCallback, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom"; // Import Link from react-router-dom
import PropTypes from "prop-types";
import DomainsApi from "../../api/Domains";
import DataApi from "../../api/Data";
import { Box, Typography, TextareaAutosize, Button, Link, Alert } from "@mui/material";
import styles from "./Integrations.module.scss";
import WarningIcon from "../../assets/warning.png";
import CopyIcon from "../../assets/copy-code.png";
import CheckInstallIcon from "../../assets/check-install.svg";
import SuccessBox from "../../components/SuccessBox/SuccessBox";

const customStyles = {
    copyCodeBtn: {
        width: 180,
        marginBottom: 50,
        height: "40px",
    },
    copyCode: {
        marginRight: "5px",
        marginBottom: "-3px",
    },
    runTestBtn: {
        width: 150,
        marginTop: 15,
        border: "none",
        fontWeight: "normal",
    },
    lastOption: {
        marginTop: 40,
    },
    textarea: {
        color: "#6f6f6f",
        width: "100%", // Full width
        resize: "vertical",
    },
    pgap: {
        marginBottom: "10px",
    },
    copyWrap: {
        display: "flex",
        alignItems: "baseline",
    },
    copied: {
        maxWidth: "200px",
        fontWeight: "600",
        marginLeft: "10px",
        padding: "10px 15px",
    },
    failed: {
        width: "50%",
        marginTop: "20px",
    },
    installFailed: {
        width: "55%",
        marginTop: "0px",
        marginBottom: "0px",
    },
    installError: {
        color: "inherit",
    },
    connectBtn: {
        textDecoration: "none",
    },
    installSuccess: {
        maxWidth: "200px",
        fontWeight: "600",
        padding: "10px 15px",
    },
};

const FraudBlockerTracker = () => {
    const codeRef = useRef(null);
    const [copiedSiteTracker, setCopiedSiteTracker] = useState(false);
    const [verified, setVerified] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [unverified, setUnverified] = useState(false);
    const [checking, setChecking] = useState(false);
    const [installSuccess, setInstallSuccess] = useState(false);
    const [installFailed, setInstallFailed] = useState(false);

    const { activeDomain } = useSelector((state) => state); // Use useSelector hook

    const copySiteTracker = useCallback(() => {
        if (!codeRef.current) return;
        const copyText = codeRef.current;
        copyText.select();
        copyText.setSelectionRange(0, 99999); /* For mobile devices */
        navigator.clipboard.writeText(copyText.value).then(
            () => {
                setCopiedSiteTracker(true);
            },
            () => {
                // Handle failure if needed.
            }
        );
    }, []);

    useEffect(() => {
        if (activeDomain?.data?.id) {
            // Safe access
            setCopiedSiteTracker(false);
            setVerifying(false);
            setVerified(false);
            setUnverified(false);
        }
    }, [activeDomain?.data?.id]);

    const runTest = useCallback(async () => {
        setVerified(false);
        setVerifying(true);
        setUnverified(false);

        try {
            const response = await DomainsApi.verifyTrackerTag(activeDomain.data);
            if (response.verified) {
                setVerified(true);
                // Optional: Google Ads conversion tracking
                if (window.gtag) {
                    const script = document.createElement("script");
                    const inlineScript = document.createTextNode(
                        `gtag('event', 'conversion', {'send_to': 'AW-743398152/MjLqCI_-wa0DEIi2veIC'});`
                    );
                    script.appendChild(inlineScript);
                    document.body.appendChild(script);
                }
            } else {
                setUnverified(true);
            }
        } catch (err) {
            console.error("Error occurred in verification", err);
            setUnverified(true);
        } finally {
            setVerifying(false);
        }
    }, [activeDomain?.data]);

    const checkInstallation = useCallback(async () => {
        setInstallSuccess(false);
        setChecking(true);
        setInstallFailed(false);

        try {
            const response = await DataApi.checkInstallation(activeDomain.data.id);
            if (response.is_present) {
                setInstallSuccess(true);
            } else {
                setInstallFailed(true);
            }
        } catch (err) {
            console.error("Error occurred in install check", err);
            setInstallFailed(err.message);
        } finally {
            setChecking(false);
        }
    }, [activeDomain?.data?.id]);

    const sid = activeDomain?.data?.id; // Safe access
    const siteTracker = `<script type="text/javascript">
  (function () {
    var s = document.createElement("script"), 
      h = document.head;
    s.async = 1;
    s.src = "https://monitor.fraudblocker.com/fbt.js?sid=${sid}";
    h.appendChild(s);
  })();
</script>
<noscript>
  <a href="https://fraudblocker.com" rel="nofollow">
    <img src="https://monitor.fraudblocker.com/fbt.gif?sid=${sid}" alt="Fraud Blocker" />
  </a>
</noscript>
`;

    return (
        <Box className={styles.content}>
            <Typography variant="h1" className={styles.title}>
                Fraud Tracker
            </Typography>
            <Typography className={styles.titleParagraph}>
                In order for us to analyze and block click fraud on your site, you must first install our Tracker code.
            </Typography>
            <Typography variant="h3" className={styles.subTitle}>
                Install Site Tracker (Required)
            </Typography>
            <Typography component="p" className={styles.installNotice}>
                <img src={WarningIcon} className={styles.warningIcon} alt="Warning" />
                <b> You must add the code below to your website </b>, immediately after the opening{" "}
                <i> &lt;head&gt; </i> tag.
            </Typography>
            <TextareaAutosize
                ref={codeRef}
                readOnly
                value={siteTracker}
                style={customStyles.textarea}
                minRows={3}
                maxRows={10}
            />
            <Box sx={customStyles.copyWrap}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={copySiteTracker}
                    sx={customStyles.copyCodeBtn}
                    startIcon={<img style={customStyles.copyCode} alt="copy" src={CopyIcon} />}
                >
                    Copy Tracker Code
                </Button>
                {copiedSiteTracker && <SuccessBox override={true} message="Copied!" sx={customStyles.copied} />}
            </Box>
            <Typography variant="h3" className={styles.subTitle}>
                How to install
            </Typography>
            <Typography sx={customStyles.pgap}>
                Similar to most analytics tags, you need to paste the code after the opening &lt;head&gt; tag in the
                global header or footer of your website. If you’re unfamiliar with this process, here are instructions
                for the most common website builders:
            </Typography>
            <ul className={styles.guidelines}>
                <li>
                    For WordPress sites:{" "}
                    <Link
                        href="https://help.fraudblocker.com/en/articles/3110894-how-to-install-fraud-blocker-s-tracking-code-with-a-wordpress-site"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for WordPress.
                    </Link>
                </li>
                <li>
                    For Wix sites:{" "}
                    <Link
                        href="https://help.fraudblocker.com/en/articles/6222893-how-to-install-fraud-blocker-s-tracking-code-on-a-wix-website"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for Wix.
                    </Link>
                </li>
                <li>
                    For Squarespace sites:{" "}
                    <Link
                        href="https://help.fraudblocker.com/en/articles/6222894-how-to-install-fraud-blocker-s-tracking-code-on-a-squarespace-website"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for Squarespace.
                    </Link>
                </li>
                <li>
                    For Shopify sites:{" "}
                    <Link
                        href="https://help.fraudblocker.com/en/articles/6355254-how-to-install-fraud-blocker-s-tracking-code-on-a-shopify-website"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for Shopify.
                    </Link>
                </li>
                <li>
                    For sites using Google Tag Manager:{" "}
                    <Link
                        href="https://help.fraudblocker.com/en/articles/6222892-how-to-install-fraud-blocker-s-tracking-code-with-google-tag-manager"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for Google Tag Manager.
                    </Link>
                </li>
            </ul>
            <Typography className={styles.otherSupport}>
                For other sites platforms,{" "}
                <Link
                    href="https://help.fraudblocker.com/en/collections/1818202-help-and-answers"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    visit our help documents
                </Link>{" "}
                or{" "}
                <Link href="https://fraudblocker.com/contact-us" target="_blank" rel="noopener noreferrer">
                    contact our Support Team.
                </Link>
            </Typography>
            <Typography className={styles.checkInstallation}>
                <strong> To make sure everything is ready, </strong>&nbsp;check that your code was installed correctly.
                <Box className={styles.checkInstallBtn}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={checkInstallation}
                        disabled={checking}
                        startIcon={<img src={CheckInstallIcon} alt="Check Installation" />}
                        sx={{ textTransform: "none" }}
                    >
                        {checking ? "Checking..." : "Check Installation"}
                    </Button>
                    {installFailed && (
                        <Alert severity="error" sx={customStyles.installFailed}>
                            Fraud Tracker not detected. Try another method in our{" "}
                            <Link
                                href="https://help.fraudblocker.com/en/articles/9375660-how-to-check-that-the-fraud-tracker-tag-is-installed-correctly"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={customStyles.installError}
                            >
                                help docs.
                            </Link>
                        </Alert>
                    )}
                    {installSuccess && (
                        <SuccessBox
                            override={true}
                            message="Installation successful! 🎉"
                            sx={customStyles.installSuccess}
                        />
                    )}
                </Box>
            </Typography>
            <Typography variant="h3" sx={customStyles.lastOption} className={styles.subTitle}>
                Next Step
            </Typography>
            <Typography>
                It can take up to 1 hour to verify your Site Tracker installation. Please connect your Google Ads
                account next.
            </Typography>
            {unverified && <ErrorBox error="The Tracker code was not found" sx={customStyles.failed} />}
            <Box sx={customStyles.copyWrap}>
                <Button
                    variant="outlined"
                    color="primary"
                    component={RouterLink}
                    to="/integrations/google-ads-setup"
                    sx={customStyles.runTestBtn}
                    disabled={verifying}
                >
                    {verifying ? "Verifying..." : "Connect Google Ads"}
                </Button>

                {verified && (
                    <Typography variant="body1" sx={customStyles.copied}>
                        ✓ Fraud Tracker Installation Successful
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

FraudBlockerTracker.propTypes = {
    activeDomain: PropTypes.shape({
        data: PropTypes.shape({
            id: PropTypes.string,
        }),
    }),
};

export default FraudBlockerTracker;
