import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Button, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./UpgradePlanDeclineModal.module.scss";
import Decline from "../../assets/decline.svg";
import { useNavigate } from "react-router-dom";

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
        inset: "20px 0 0 0", // Using 'inset'
        width: 577,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "75px",
        position: "relative",
    },
};

const UpgradePlanDeclineModal = ({ isOpen, toggleModal, history }) => {
    const navigate = useNavigate();

    const handleCloseModal = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const goToDashboard = useCallback(() => {
        navigate("/dashboard");
    }, [navigate]);

    return (
        <Modal isOpen={isOpen} style={customStyles} ariaHideApp={false} contentLabel="Compare Plans">
            <Box className={styles.container}>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box className={styles.content}>
                    <Box className={styles.headerText}>
                        <Box className={styles.imgSec}>
                            <img src={Decline} className={styles.icon} alt="Decline" />
                        </Box>
                        <Typography variant="h5" component="div" className={styles.textSecHead}>
                            We’re sorry!
                            <Typography component="span">
                                Something went wrong and your adjustment couldn’t be completed.
                            </Typography>
                        </Typography>
                    </Box>
                    <Box className={styles.btnWrapper}>
                        <Button onClick={goToDashboard} variant="contained" color="info">
                            Back To Dashboard
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

UpgradePlanDeclineModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    history: PropTypes.any, // Could be more specific with react-router-dom's history shape
};

export default UpgradePlanDeclineModal;
