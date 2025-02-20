import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Button, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./CancelReasonSolutionModal.module.scss";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import DiscountIcon from "../../assets/discount-icon.svg";
import CallIcon from "../../assets/call-icon.svg";
import BackBtnIcon from "../../assets/back-btn.svg";

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
        width: 600,
        inset: "20px 0 0 0", // Use 'inset'
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "30px",
        position: "relative",
    },
};

const CancelReasonSolutionModal = ({ reason, isOpen, isLoading, handleSolutionAction, toggleModal, error, goBack }) => {
    const handleCloseModal = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const handleGoBack = useCallback(() => {
        goBack();
    }, [goBack]);

    const getActionIcon = useCallback(() => {
        return ["tech-issue", "no-results"].includes(reason) ? CallIcon : DiscountIcon;
    }, [reason]);

    const getHeading = useCallback(() => {
        if (["too-expensive", "paused-ppc"].includes(reason)) {
            return "Would You Like 50% Off Your Plan?";
        }
        if (reason === "no-results") {
            return "Schedule A Call To Review Results";
        }
        return "Schedule A Call With Support";
    }, [reason]);

    const getDescription = useCallback(() => {
        if (["too-expensive", "paused-ppc"].includes(reason)) {
            return "We can immediately offer you 50% off your monthly plan for the next 3 months to continue trying out service.";
        }
        if (reason === "no-results") {
            return "You may be able to improve your results with changes to your customization settings.";
        }
        return "Would you like to speak to one of our technical specialists to help with your issue?";
    }, [reason]);

    return (
        <Modal isOpen={isOpen} style={customStyles} contentLabel="Alert" ariaHideApp={false}>
            <Box className={styles.container}>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <IconButton onClick={handleGoBack} sx={{ position: "absolute", left: "10px", top: "10px" }}>
                    <img src={BackBtnIcon} alt="Go Back" style={{ marginRight: "5px" }} /> Go Back
                </IconButton>
                <Box className={styles.content}>
                    <Box className={styles.contentWrapper}>
                        <Box className={styles.imgContain}>
                            <img src={getActionIcon()} className={styles.icon} alt="Action Icon" />
                        </Box>
                        <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                            {getHeading()}
                        </Typography>
                        <Typography className={styles.descriptionText}>{getDescription()}</Typography>

                        <Box className={styles.btnContainer}>
                            <Button
                                onClick={() => handleSolutionAction(true)}
                                disabled={isLoading}
                                variant="contained"
                                color="info"
                            >
                                {["too-expensive", "paused-ppc"].includes(reason)
                                    ? "Yes, I’ll Take The Deal!"
                                    : "Yes, Schedule A Call"}
                            </Button>
                            <Button onClick={() => handleSolutionAction(false)} variant="text" color="primary">
                                No, Just Cancel My Plan
                            </Button>
                        </Box>
                        {error && <ErrorBox error={error} />}
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

CancelReasonSolutionModal.propTypes = {
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
    toggleModal: PropTypes.func,
    error: PropTypes.any,
    reason: PropTypes.string,
    handleSolutionAction: PropTypes.func,
    goBack: PropTypes.func,
};

export default CancelReasonSolutionModal;
