import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import {
    Button,
    Typography,
    Box,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./CancelReasonModal.module.scss";

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

const CancelReasonModal = ({ toggleModal, isOpen, handleCancelReason }) => {
    const [reason, setReason] = useState("");

    const onReasonChange = useCallback((event) => {
        setReason(event.target.value);
    }, []);

    const handleCloseModal = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const handleContinue = useCallback(() => {
        handleCancelReason(reason);
    }, [handleCancelReason, reason]);

    return (
        <Modal isOpen={isOpen} style={customStyles} contentLabel="Alert" ariaHideApp={false}>
            <Box className={styles.container}>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box className={styles.content}>
                    <Box className={styles.contentWrapper}>
                        <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                            Cancellation Reason
                        </Typography>
                        <Typography className={styles.descriptionText}>
                            Please tell us the reason for your cancellation
                        </Typography>

                        <FormControl component="fieldset" sx={{ mt: 2 }}>
                            <FormLabel component="legend" sx={{ mb: 1 }}>
                                Select a reason:
                            </FormLabel>
                            <RadioGroup
                                name="reason"
                                value={reason}
                                onChange={onReasonChange}
                                className={styles.reasons}
                            >
                                <FormControlLabel value="too-expensive" control={<Radio />} label="Too expensive" />
                                <FormControlLabel
                                    value="tech-issue"
                                    control={<Radio />}
                                    label="I'm having technical issues"
                                />
                                <FormControlLabel
                                    value="no-results"
                                    control={<Radio />}
                                    label="I'm not seeing results"
                                />
                                <FormControlLabel
                                    value="paused-ppc"
                                    control={<Radio />}
                                    label="I've paused my PPC campaigns"
                                />
                                <FormControlLabel
                                    value="other-reasons"
                                    control={<Radio />}
                                    label="I'm cancelling for other reasons"
                                />
                            </RadioGroup>
                        </FormControl>

                        <Box className={styles.btnContainer}>
                            <Button onClick={handleContinue} variant="contained" color="info" disabled={!reason}>
                                Continue With Cancellation
                            </Button>
                        </Box>
                        <Box className={styles.btnContainer}>
                            <Button variant="text" onClick={handleCloseModal} color="primary">
                                Do Not Cancel
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

CancelReasonModal.propTypes = {
    isOpen: PropTypes.bool,
    isBooster: PropTypes.bool, // Not used in the component, but kept
    toggleModal: PropTypes.func,
    handleCancelReason: PropTypes.func,
};

export default CancelReasonModal;
