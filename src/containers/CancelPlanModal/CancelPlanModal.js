import React, { useCallback } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import Modal from "react-modal";
import { Button, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./CancelPlanModal.module.scss";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import CancelIcon from "../../assets/cancel-icon.svg";

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
        inset: "20px 0 0 0", // Using 'inset'
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "30px",
        position: "relative",
    },
};

const CancelPlanModal = ({ toggleModal, isOpen, error, isLoading, cancelSubscription, lastDate }) => {
    const handleClose = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const handleConfirmCancellation = useCallback(() => {
        cancelSubscription();
    }, [cancelSubscription]);

    return (
        <Modal isOpen={isOpen} style={customStyles} contentLabel="Alert" ariaHideApp={false}>
            <Box className={styles.container}>
                <IconButton onClick={handleClose} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box className={styles.content}>
                    <Box className={styles.contentWrapper}>
                        <Box className={styles.imgContain}>
                            <img src={CancelIcon} className={styles.icon} alt="Cancel Icon" />
                        </Box>
                        <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                            Review of Cancellation
                        </Typography>
                        <Typography className={styles.descriptionText}>
                            By pressing this button your plan will be canceled.
                        </Typography>
                        <br />
                        <Typography className={styles.descriptionText}>
                            You can continue using our service until the end of your current billing period on{" "}
                            {moment.unix(lastDate).format("MMMM D, একসঙ্গে")}.
                        </Typography>

                        <Box className={styles.btnContainer}>
                            <Button
                                onClick={handleConfirmCancellation}
                                disabled={isLoading}
                                variant="contained"
                                color="primary"
                            >
                                Confirm Cancellation Of Plan
                            </Button>
                        </Box>
                        {error && <ErrorBox error={error} />}
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

CancelPlanModal.propTypes = {
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
    toggleModal: PropTypes.func,
    cancelSubscription: PropTypes.func,
    error: PropTypes.any,
    lastDate: PropTypes.number,
    isBooster: PropTypes.bool, // Not used in the component, but kept in propTypes
};

export default CancelPlanModal;
