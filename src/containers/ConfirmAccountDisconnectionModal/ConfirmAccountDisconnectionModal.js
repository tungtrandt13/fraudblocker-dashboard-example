import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Button, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./ConfirmAccountDisconnectionModal.module.scss";
import WarnIcon from "../../assets/warn-big.svg";

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
        width: 500, // Default width
        inset: "20px 0 0 0", // Use 'inset'
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "0px", // Keep as string for consistency with original
        position: "relative",
    },
};

const ConfirmDisconnectionModal = ({ onCancel, onConfirm, isLoading, recordId, isAll }) => {
    const handleConfirm = useCallback(() => {
        onConfirm(recordId);
    }, [onConfirm, recordId]);

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    const modalStyle = {
        // Dynamically adjust width based on isAll
        ...customStyles,
        content: {
            ...customStyles.content,
            width: isAll ? 600 : 500,
        },
    };

    return (
        <Modal isOpen={true} style={modalStyle} contentLabel="Alert" ariaHideApp={false}>
            <Box className={styles.container}>
                <IconButton onClick={handleCancel} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box className={styles.content}>
                    <Box className={styles.contentWrapper} sx={{ padding: "30px" }}>
                        {isAll && <img src={WarnIcon} alt="warning" className={styles.removeAccountWarningIcon} />}
                        <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                            {isAll ? "Remove your Google account" : "Disconnect this Google Ads Account?"}
                        </Typography>
                        <Typography className={styles.descriptionText}>
                            {isAll
                                ? "By removing your Google account, all domain names currently connected to that account will be disconnected from Fraud Blocker. This action will also no longer send invalid IP addresses to your Google Ads account and all existing IP addresses in the IP exclusions of those accounts will be removed in approx. 30 mins."
                                : "This action will no longer send invalid IP addresses to your Google Ads campaigns and all existing IP addresses in the IP exclusions of the account will be removed in approx. 30 mins."}
                        </Typography>

                        <Box
                            className={styles.btnContainer}
                            sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "center" }}
                        >
                            <Button onClick={handleCancel} disabled={isLoading} variant="text" color="primary">
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} disabled={isLoading} variant="contained" color="primary">
                                {isLoading ? "Loading..." : "Continue"}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

ConfirmDisconnectionModal.propTypes = {
    isLoading: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    recordId: PropTypes.string, // Can be null
    type: PropTypes.string, // Not used in the code, consider removing or adding functionality
    isAll: PropTypes.bool,
};

export default ConfirmDisconnectionModal;
