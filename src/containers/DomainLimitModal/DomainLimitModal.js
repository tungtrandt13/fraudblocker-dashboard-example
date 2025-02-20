import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useDispatch, useSelector } from "react-redux";
import styles from "./DomainLimitModal.module.scss";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import SuccessBox from "../../components/SuccessBox/SuccessBox";
import Account from "../../redux/actions/Account";
import Domains from "../../api/Domains";
import TooltipIcon from "../../assets/tooltip.svg";

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
        position: "relative",
        inset: "20px 0 0 0", // Use 'inset'
        width: 400,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "40px",
    },
};

const DomainLimitModal = ({
    isOpen,
    totalClicks,
    availableClicks,
    sid,
    onSuccess,
    onCancel,
    currentLimit,
    currentClicks,
}) => {
    const [clicksLimit, setClicksLimit] = useState(currentLimit);
    const [loading, setLoading] = useState(false);
    const [apiSuccess, setApiSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const dispatch = useDispatch();
    const { accounts } = useSelector((state) => state);

    useEffect(() => {
        setClicksLimit(currentLimit);
    }, [currentLimit]);

    const handleCloseModal = useCallback(() => {
        setClicksLimit("");
        onCancel && onCancel();
    }, [onCancel]);

    useEffect(() => {
        ReactTooltip.rebuild();
    }, [isOpen]);

    const onInputChange = useCallback((event) => {
        setClicksLimit(event.target.value);
    }, []);

    const onClickSetLimit = useCallback(async () => {
        setErrors({});
        setApiSuccess(false);

        let limit = null;
        if (clicksLimit) {
            limit = parseInt(clicksLimit, 10);
            if (limit > availableClicks && limit > currentLimit + availableClicks) {
                setErrors({
                    apiError: "<strong>Whoops!</strong> The total clicks you entered goes beyond the available clicks.",
                });
                return;
            }

            if (limit < currentClicks) {
                setErrors({
                    apiError:
                        "<strong>Whoops!</strong> The current usage has already passed the total clicks you entered.",
                });
                return;
            }
        }

        setLoading(true);
        try {
            await Domains.updateDomain(sid, { clicks_limit: limit });
            await dispatch(Account.fetchLatestAccount(accounts.data.id));
            setLoading(false);
            setClicksLimit(""); // Reset after success.
            onSuccess && onSuccess();
        } catch (error) {
            setErrors({ apiError: error.message });
            setLoading(false);
        }
    }, [clicksLimit, availableClicks, currentLimit, currentClicks, sid, accounts.data.id, onSuccess, dispatch]);

    return (
        <Modal isOpen={isOpen} style={customStyles} contentLabel="Domain click limit modal" ariaHideApp={false}>
            <Box className={styles.container}>
                <ReactTooltip id="availableClicks" className={styles.tooltipContent}>
                    <Box>This is your total purchased clicks less any limits you've set on other websites.</Box>
                </ReactTooltip>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box className={styles.content}>
                    <Typography variant="h5" component="p" className={styles.setLimitText} gutterBottom>
                        Set a Click Limit
                    </Typography>
                    <Typography className={styles.limitLabel}>
                        Enter a click total, not to exceed your available clicks
                    </Typography>
                    <Box className={styles.limitInputWrapper}>
                        <TextField
                            onChange={onInputChange}
                            value={clicksLimit}
                            type="number"
                            name="clicksLimit"
                            error={!!errors.apiError} // Connect error state to TextField
                            sx={{ width: "40%" }} // Use MUI's sx for styling
                        />
                        <Button
                            onClick={onClickSetLimit}
                            variant="outlined"
                            color="primary"
                            disabled={loading}
                            sx={{ width: "55%", height: "38px" }}
                        >
                            {loading ? "Saving..." : "Save And Close"}
                        </Button>
                    </Box>

                    <Box className={styles.clicksCount}>
                        <Box className={styles.section}>
                            <Typography className={styles.countLabel}>Purchased Clicks</Typography>
                            <Typography>
                                {totalClicks &&
                                    totalClicks.toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}
                            </Typography>
                        </Box>
                        <Box className={styles.section}>
                            <Typography className={styles.countLabel}>
                                Available Clicks
                                <img
                                    src={TooltipIcon}
                                    data-tip
                                    data-for="availableClicks"
                                    alt="tooltip"
                                    style={{ marginLeft: "5px" }} // Add some spacing for the tooltip
                                />
                            </Typography>
                            <Typography>
                                {availableClicks &&
                                    availableClicks.toLocaleString("en-US", {
                                        maximumFractionDigits: 1,
                                    })}
                            </Typography>
                        </Box>
                    </Box>
                    {errors.apiError && <ErrorBox error={errors.apiError} />}
                    {apiSuccess && <SuccessBox message="You've added the limit successfully." />}
                </Box>
            </Box>
        </Modal>
    );
};

DomainLimitModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    totalClicks: PropTypes.number,
    availableClicks: PropTypes.number,
    sid: PropTypes.string,
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func,
    currentLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currentClicks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default DomainLimitModal;
