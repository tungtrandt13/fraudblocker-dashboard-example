import React, { useState, useRef, useCallback, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { Box, Typography, TextareaAutosize, Button, Link } from "@mui/material";
import styles from "./Integrations.module.scss";
import CopyIcon from "../../assets/copy-code.png";
import SuccessBox from "../../components/SuccessBox/SuccessBox";

const customStyles = {
    copyCodeBtn: {
        width: 180,
        marginBottom: "50px",
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
        width: "100%", // Make textarea take full width
        resize: "vertical", // Allow vertical resizing
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
    connectBtn: {
        textDecoration: "none",
    },
};

const ConversionTracking = () => {
    const codeRef = useRef(null);
    const [copiedSiteTracker, setCopiedSiteTracker] = useState(false);
    const { activeDomain } = useSelector((state) => state); // Use useSelector

    const sid = activeDomain?.data?.id; // Safe access

    const siteTracker = `<script type="text/javascript">
        (function () {
          var s = document.createElement("script"),
          h = document.head;
          s.async = 1;
          s.src = "https://monitor.fraudblocker.com/ctrack.js?sid=${sid}";
          h.appendChild(s);
      })();
    </script>
    <noscript>
      <a href="https://fraudblocker.com" rel="nofollow">
        <img src="https://monitor.fraudblocker.com/ctrack.js?sid=${sid}" alt="Fraud Blocker" />
      </a>
    </noscript>
  `;

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
                // Handle copy failure if needed
            }
        );
    }, []);

    useEffect(() => {
        if (activeDomain?.data?.id) {
            setCopiedSiteTracker(false);
        }
    }, [activeDomain?.data?.id]);

    return (
        <Box className={styles.content}>
            <Typography variant="h1" className={styles.title}>
                Conversion Tracking
            </Typography>
            <Typography className={styles.titleParagraph}>
                This allows us to track if a visitor converted to a sale or a lead on your website. If a visitor
                converts, then we will avoid blocking that visitor’s IP address and device in the future. Once
                installed, conversion data will appear alongside your IP data in your“ Reports” and“ Fraud Score” pages.
            </Typography>
            <Typography variant="h3" className={styles.subTitle}>
                Install Conversion Tracker (Optional)
            </Typography>
            <Typography>This is your custom Conversion tracking code:</Typography>

            <TextareaAutosize
                ref={codeRef}
                readOnly
                value={siteTracker}
                style={customStyles.textarea}
                minRows={3} // Set minimum rows
                maxRows={10} // Set maximum rows if you like
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
                Copy the code above and paste it immediately after the opening &lt;body&gt; tag of your“ thank you”
                page. See our guide{" "}
                <Link
                    href="https://help.fraudblocker.com/en/articles/8694696-how-do-i-install-conversion-tracking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.blueLink}
                >
                    here
                </Link>
                .
            </Typography>
        </Box>
    );
};

ConversionTracking.propTypes = {
    activeDomain: PropTypes.shape({
        data: PropTypes.shape({
            id: PropTypes.string,
        }),
    }),
};

export default ConversionTracking;
