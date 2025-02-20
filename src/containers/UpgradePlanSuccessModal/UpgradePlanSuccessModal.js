import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Button, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./UpgradePlanSuccessModal.module.scss";
import Badge from "../../assets/badge.svg";
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
        inset: "20px 0 0 0", // Use 'inset'
        width: 390,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "75px",
        position: "relative",
    },
};

const UpgradePlanSuccessModal = ({ isOpen, toggleModal, history }) => {
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
                            <img src={Badge} className={styles.icon} alt="Badge" />
                        </Box>
                        <Typography variant="h5" component="div" className={styles.textSecHead}>
                            You’re All Set
                            <Typography component="span">Your plan has now been adjusted.</Typography>
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

UpgradePlanSuccessModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    history: PropTypes.any, // Better to use react-router-dom's history shape if possible
};

export default UpgradePlanSuccessModal;
