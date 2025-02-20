import React, { useCallback } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { Button, Typography, Box } from "@mui/material";
import styles from "./UnprotectedAccountModal.module.scss";
import ErrorImage from "../../assets/robot.svg";

const customStyles = {
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        overflow: "auto",
        padding: "40px 0",
    },
    content: {
        inset: "20px 0 0 0", // Use 'inset' for positioning
        width: 551,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "40px 45px",
        position: "relative",
    },
};

const UnprotectedAccountModal = ({ isOpen, isAppSumo, onSelectPlanClick }) => {
    const onClick = useCallback(() => {
        if (!isAppSumo) {
            onSelectPlanClick();
        } else {
            window.open("https://appsumo.com/account/products/");
        }
    }, [isAppSumo, onSelectPlanClick]);

    return (
        <Modal
            isOpen={isOpen}
            style={customStyles}
            className={styles.modalWrapper}
            ariaHideApp={false}
            contentLabel="Notifications"
        >
            <Box className={styles.container}>
                <Box className={styles.content}>
                    <Box className={styles.imgWrapper}>
                        <img src={ErrorImage} alt="Error" />
                    </Box>
                    <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                        {isAppSumo ? "Warning!" : "Alert!"}
                    </Typography>
                    {isAppSumo ? (
                        <Box className={styles.gridContent}>
                            <Typography>
                                You have canceled your AppSumo plan and{" "}
                                <a className={styles.noLink} href="#">
                                    your website is unprotected.
                                </a>
                            </Typography>
                            <Typography>
                                You must upgrade your plan to continue using Fraudblocker and protect your account from
                                click fraud and wasted ad spend.
                            </Typography>
                        </Box>
                    ) : (
                        <Box className={styles.gridContent}>
                            <Typography>
                                Your plan was canceled and{" "}
                                <a className={styles.noLink} href="#">
                                    your ads are unprotected from click fraud.
                                </a>
                            </Typography>
                            <Typography>You must select a new plan to continue fraud monitoring.</Typography>
                        </Box>
                    )}
                    <Box className={styles.buttonWrapper}>
                        <Button
                            onClick={onClick}
                            variant="contained"
                            color="success" // Use MUI's color prop
                            className={styles.updateButton}
                        >
                            {!isAppSumo ? "Select A Plan" : "Update My Plan"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

UnprotectedAccountModal.propTypes = {
    isOpen: PropTypes.bool,
    onSelectPlanClick: PropTypes.func,
    isAppSumo: PropTypes.bool,
};

export default UnprotectedAccountModal;
