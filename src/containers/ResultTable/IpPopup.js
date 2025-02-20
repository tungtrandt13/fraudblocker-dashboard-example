import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Popover, Typography, Box, Table, TableBody, TableCell, TableRow, TableHead } from "@mui/material";
import Constants from "../../utils/Constants";
import styles from "./IpPopup.module.scss";
import ABOUT_DATA_ICON from "../../assets/aboutdata.svg";

const { countryNameMapping } = Constants;

const IpPopup = ({ details, targetElem, handlePopoverClose, isOpen }) => {
    const getFraudLevel = useCallback((avg) => {
        if (avg >= 7) {
            return "high";
        }
        if (avg > 3) {
            return "medium";
        }
        if (avg > 0) {
            return "low";
        }
        return "clean";
    }, []);

    const onMouseLeave = useCallback(
        (e) => {
            // Debounce the close event to prevent immediate close on hover
            setTimeout(() => {
                handlePopoverClose(e);
            }, 100);
        },
        [handlePopoverClose]
    );

    const riskContributors = details && details.riskContributors ? JSON.parse(details.riskContributors) : null;

    return (
        <Popover
            id="ip-popup"
            className={styles.ipPopover}
            open={isOpen}
            anchorEl={targetElem}
            anchorOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "bottom",
                horizontal: "left",
            }}
            onClose={handlePopoverClose}
            disableRestoreFocus
        >
            <Box className={styles.ipPopupContainer} onMouseLeave={onMouseLeave}>
                {details && (
                    <Box className={styles.ipPopupContent}>
                        <Table cellSpacing={0}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>IP Address</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Fraud Score</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell className={styles.boldValue}>{details.ip}</TableCell>
                                    <TableCell>
                                        {details && details.country ? (
                                            <>
                                                <img
                                                    style={{ width: "20px", height: "14px" }}
                                                    src={`flags/${details.country.toLowerCase()}.svg`}
                                                    alt={details.country} // Add alt text
                                                />
                                                &nbsp;
                                                {countryNameMapping[details.country] || details.country}
                                            </>
                                        ) : (
                                            ""
                                        )}
                                    </TableCell>
                                    <TableCell className={styles.boldValue}>{details.riskScore.toFixed(1)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        <Box className={styles.stats}>
                            <Box className={styles.leftStats}>
                                <Box>
                                    <Typography component="article" className={styles.label}>
                                        VPN / Datacenter
                                    </Typography>
                                    <Typography
                                        component="article"
                                        className={`${styles.value} ${
                                            styles[getFraudLevel(riskContributors?.dcRiskPoints)] //Safe access
                                        }`}
                                    >
                                        {getFraudLevel(riskContributors?.dcRiskPoints)} {/*Safe access*/}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography component="article" className={styles.label}>
                                        Risky Device
                                    </Typography>
                                    <Typography
                                        component="article"
                                        className={`${styles.value} ${
                                            styles[getFraudLevel(riskContributors?.deviceRiskPoints)] //Safe access
                                        }`}
                                    >
                                        {getFraudLevel(riskContributors?.deviceRiskPoints)} {/*Safe access*/}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography component="article" className={styles.label}>
                                        Excessive Clicks
                                    </Typography>
                                    <Typography
                                        component="article"
                                        className={`${styles.value} ${
                                            styles[getFraudLevel(riskContributors?.fastClickersRiskPoints)] //Safe access
                                        }`}
                                    >
                                        {getFraudLevel(riskContributors?.fastClickersRiskPoints)} {/*Safe access*/}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography component="article" className={styles.label}>
                                        Poor IP History
                                    </Typography>
                                    <Typography
                                        component="article"
                                        className={`${styles.value} ${
                                            styles[
                                                getFraudLevel(riskContributors?.historicalClicksRiskPoints) //Safe access
                                            ]
                                        }`}
                                    >
                                        {getFraudLevel(riskContributors?.historicalClicksRiskPoints)} {/*Safe access*/}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box className={styles.rightStats}>
                                <Box>
                                    <Typography component="article" className={styles.label}>
                                        Accidental Clicks
                                    </Typography>
                                    <Typography
                                        component="article"
                                        className={`${styles.value} ${
                                            styles[
                                                getFraudLevel(riskContributors?.accidentalClicksRiskPoints) //Safe access
                                            ]
                                        }`}
                                    >
                                        {getFraudLevel(riskContributors?.accidentalClicksRiskPoints)} {/*Safe access*/}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography component="article" className={styles.label}>
                                        Abuse / Very High Risk
                                    </Typography>
                                    <Typography
                                        component="article"
                                        className={`${styles.value} ${
                                            styles[
                                                getFraudLevel(riskContributors?.headlessBrowserRiskPoints) //Safe access
                                            ]
                                        }`}
                                    >
                                        {getFraudLevel(riskContributors?.headlessBrowserRiskPoints)} {/*Safe access*/}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography component="article" className={styles.label}>
                                        Risky Geo
                                    </Typography>
                                    <Typography
                                        component="article"
                                        className={`${styles.value} ${
                                            styles[getFraudLevel(riskContributors?.geoRiskPoints)] //Safe access
                                        }`}
                                    >
                                        {getFraudLevel(riskContributors?.geoRiskPoints)} {/*Safe access*/}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography component="article" className={styles.label}>
                                        Other Risk
                                    </Typography>
                                    <Typography component="article" className={`${styles.value} ${styles.clean}`}>
                                        clean
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box className={styles.aboutLink}>
                            <Link
                                href="https://help.fraudblocker.com/en/articles/8127810-what-is-the-ip-clarity-data"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img src={ABOUT_DATA_ICON} alt="about" />
                                About This Data
                            </Link>
                        </Box>
                    </Box>
                )}
            </Box>
        </Popover>
    );
};

IpPopup.propTypes = {
    details: PropTypes.shape({
        ip: PropTypes.string,
        country: PropTypes.string,
        riskScore: PropTypes.number,
        riskContributors: PropTypes.string,
    }),
    targetElem: PropTypes.any, // Could be more specific if you know the type of element
    isOpen: PropTypes.bool,
    handlePopoverClose: PropTypes.func.isRequired,
};

export default IpPopup;
