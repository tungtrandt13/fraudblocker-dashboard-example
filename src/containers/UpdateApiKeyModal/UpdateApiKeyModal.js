import React, { useState, useCallback, useEffect } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import styles from "./UpdateApiKeyModal.module.scss";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import ApiKey from "../../api/ApiKey";

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
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
        width: 410,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "65px",
    },
    addDomainBtn: {
        alignSelf: "center",
        height: "40px",
    },
    inputStyle: {
        maxWidth: 400,
        alignSelf: "center",
        width: "220px",
    },
    fieldError: {
        alignSelf: "center",
    },
};

const UpdateApiKeyModal = ({ id, label: initialLabel, onClose, onSuccess }) => {
    const [label, setLabel] = useState(initialLabel);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setLabel(initialLabel);
    }, [initialLabel]);

    const onLabelChange = useCallback((event) => {
        setLabel(event.target.value);
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            setErrors({}); // Clear previous errors
            setLoading(true);

            const result = await ApiKey.updateApiKey(id, { label });

            window.Intercom("trackEvent", "update-api-key", {
                label,
                key: result.key,
            });

            onSuccess({ id, label });
            onClose();
        } catch (error) {
            setErrors({ apiError: error.message });
        } finally {
            setLoading(false);
        }
    }, [id, label, onClose, onSuccess]);

    return (
        <Modal isOpen={true} style={customStyles} contentLabel="Update api key" ariaHideApp={false}>
            <span className={styles.closeBtn} onClick={onClose} aria-hidden="true">
                ×
            </span>
            <div className={styles.apiModalContainer}>
                <div className={styles.content}>
                    <p className={styles.addNewDomainText}> Change Label </p>
                    <div className={styles.changeLabelDesc}>
                        <p className={styles.descriptionText}>Enter a new label name.</p>
                    </div>
                    {errors.apiError && <ErrorBox error={errors.apiError} />}
                    <div className={styles.inputAndButton}>
                        <Input
                            onChange={onLabelChange}
                            value={label}
                            name="label"
                            style={customStyles.inputStyle}
                            placeholder=""
                        />
                        <Button
                            onClick={handleSubmit}
                            title="Save And Close"
                            loading={loading}
                            color="lt-blue"
                            style={customStyles.addDomainBtn}
                            disabled={!label}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

UpdateApiKeyModal.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
};

export default UpdateApiKeyModal;
