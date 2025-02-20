import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import styles from "./AccountExistModal.module.scss";
import Button from "../../../components/Button/Button";
import ErrorBox from "../../../components/ErrorBox/ErrorBox";
import AccountExistIcon from "../../../assets/account-exists.svg";
import Users from "../../../api/Users";

const modalStyles = {
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
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: "30px",
        position: "relative",
    },
};

function AccountExistModal({ isOpen, email, appSumoPlanId, redirectUser, planId, invoiceId }) {
    const [state, setState] = useState({
        isLoading: false,
        error: "",
    });

    const updateIntercom = (userData) => {
        window.Intercom("update", {
            email,
            user_id: userData.id,
            appsumo: true,
        });

        window.Intercom("trackEvent", "appsumo-register", {
            domain: userData.domain,
            appsumo: true,
            email,
            user_id: userData.id,
            plan: planId,
        });
    };

    const handleAddAppSumoPlan = async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: "" }));

        try {
            const response = await Users.linkAppSumoAccount({
                email,
                appSumoPlanId,
                planId,
                invoiceId,
            });

            if (response) {
                updateIntercom(response);
                redirectUser();
            }
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: error.message,
            }));
        } finally {
            setState((prev) => ({
                ...prev,
                isLoading: false,
            }));
        }
    };

    const renderErrorMessage = () => (
        <div>
            <strong>Whoops!</strong> This account already has an active plan. Please contact us.
        </div>
    );

    return (
        <Modal isOpen={isOpen} style={modalStyles} contentLabel="Account Exists Alert" ariaHideApp={false}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.contentWrapper}>
                        <div className={styles.imgContain}>
                            <img src={AccountExistIcon} className={styles.icon} alt="Account exists icon" />
                        </div>

                        <h2 className={styles.headerText}>An Account Already Exists</h2>

                        <p className={styles.headerSubText}>for the email {email}</p>

                        <p className={styles.descriptionText}>
                            By pressing this button, your new AppSumo plan will be added to this account. Once
                            completed, you will then be directed to login to begin using our services.
                        </p>

                        {state.error && <ErrorBox error={renderErrorMessage()} />}

                        <div className={styles.btnContainer}>
                            <Button
                                onClick={handleAddAppSumoPlan}
                                title="Add AppSumo Plan"
                                color="lt-blue"
                                loading={state.isLoading}
                                disabled={state.isLoading}
                                aria-label="Add AppSumo Plan to existing account"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

AccountExistModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    email: PropTypes.string.isRequired,
    appSumoPlanId: PropTypes.string.isRequired,
    planId: PropTypes.string.isRequired,
    invoiceId: PropTypes.string.isRequired,
    redirectUser: PropTypes.func.isRequired,
};

export default React.memo(AccountExistModal);
