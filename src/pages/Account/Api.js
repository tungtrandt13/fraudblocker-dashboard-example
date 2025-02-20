import React, { useState, useEffect, useCallback } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import PropTypes from "prop-types";
import styles from "./Account.module.scss";
import Button from "../../components/Button/Button";
import SuccessBox from "../../components/SuccessBox/SuccessBox";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import AddApiKeyModal from "../../containers/AddApiKeyModal/AddApiKeyModal";
import UpdateApiKeyModal from "../../containers/UpdateApiKeyModal/UpdateApiKeyModal";
import ApiKey from "../../api/ApiKey";
import { ReactComponent as DeleteIcon } from "../../assets/delete-icon.svg";
import CopyIcon from "../../assets/copy-key.png";
import EYE_SHOW from "../../assets/pass-show.svg";
import EYE_HIDE from "../../assets/pass-hide.svg";

const customStyles = {
    addDomainBtn: {
        width: "auto",
        minWidth: 125,
        maxWidth: 125,
        marginRight: 15,
        border: "none",
        fontWeight: "normal",
        color: "#286cff",
    },
    removeBtn: {
        minWidth: 0,
        paddingLeft: 10,
        paddingRight: 10,
        cursor: "pointer",
        fontSize: 12,
        height: 17,
        width: "auto",
    },
    copied: {
        position: "absolute",
        bottom: "25px",
        right: "10px",
        fontWeight: "600",
        padding: "10px 15px",
    },
    copyBtn: {
        marginLeft: "10px",
    },
};

const Api = () => {
    const [totalUsage, setTotalUsage] = useState(0);
    const [apiKeys, setApiKeys] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState({});
    const [removeIndex, setRemoveIndex] = useState("");
    const [showUpdateLabelModal, setShowUpdateLabelModal] = useState(false);
    const [showAddLabelModal, setShowAddLabelModal] = useState(false);
    const [unmaskApiKey, setUnmaskApiKey] = useState(null);
    const [selectedApiKey, setSelectedApiKey] = useState(null);
    const [copied, setCopied] = useState(false);

    const auth = useSelector((state) => state.auth);

    const toggleApiKey = useCallback((val) => {
        setUnmaskApiKey(val);
    }, []);

    const toggleAddLabelModal = useCallback(() => {
        setShowAddLabelModal((prev) => !prev);
    }, []);

    const toggleUpdateLabelModal = useCallback((apiKey = null) => {
        setShowUpdateLabelModal((prev) => !prev);
        setSelectedApiKey(apiKey);
    }, []);

    useEffect(() => {
        const fetchApiKeys = async () => {
            try {
                setLoading(true);
                const result = await ApiKey.getApiKeys();
                setApiKeys(result);
                setTotalUsage(result.reduce((acc, curr) => acc + Number(curr.units_consumed), 0));
            } catch (error) {
                setErrors({ apiError: error.message });
            } finally {
                setLoading(false);
            }
        };

        fetchApiKeys();
    }, []);

    const onClickRemoveApiKey = useCallback(
        async (index) => {
            try {
                if (removeIndex) {
                    return;
                }
                setErrors({ apiError: "" });
                setRemoveIndex(index);

                await ApiKey.removeApiKey(apiKeys[index].id);

                window.Intercom("trackEvent", "remove-api-key", {
                    label: apiKeys[index].label,
                    key: apiKeys[index].key,
                });

                setApiKeys((prevApiKeys) => prevApiKeys.filter((apikey) => apikey.key !== apiKeys[index].key));
            } catch (error) {
                setErrors({ apiError: error.message });
            } finally {
                setRemoveIndex("");
            }
        },
        [apiKeys, removeIndex]
    );

    const onNewKeyAdded = useCallback((apikey) => {
        setApiKeys((prevApiKeys) => [...prevApiKeys, apikey]);
    }, []);

    const onKeyUpdated = useCallback((apikey) => {
        setApiKeys((prevApiKeys) => prevApiKeys.map((key) => (key.id === apikey.id ? { ...key, ...apikey } : key)));
    }, []);

    const copyApiKey = useCallback((key) => {
        navigator.clipboard.writeText(key);
        setCopied(key);
        // Clear copied state after 3 seconds
        setTimeout(() => {
            setCopied(false);
        }, 3000);
    }, []);

    return (
        <div className={`${styles.content} ${styles.apiContent}`}>
            <h1 className={styles.title}> API </h1>
            <h3 className={styles.subTitle}> API Keys </h3>
            <p>
                You'll need an API key to send requests view Fraud Blocker's API.
                <a
                    className={styles.learnMoreApi}
                    href="https://help.fraudblocker.com/en/articles/10263302-how-to-use-fraud-blocker-s-api"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn more about our API.
                </a>
            </p>
            <div className={styles.subscriptionWrapper}>
                <div className={styles.apiKeysList}>
                    <div className={styles.apiKeysListTable}>
                        <div className={`${styles.listHead} ${styles.apiKeysHead}`}>
                            <div className={styles.listHeading}> Label </div>
                            <div className={styles.listHeading}> API Keys </div>
                            <div className={styles.listHeading}> Created </div>
                            <div className={styles.listHeading}> Units Consumed </div>
                            <div className={styles.listHeading}> Limit </div>
                            <div className={styles.listHeading}> Action </div>
                        </div>
                        <div className={styles.listBody}>
                            {apiKeys.map((apikey, index) => (
                                <div
                                    key={apikey.id}
                                    className={`${styles.listBodyRow} ${
                                        removeIndex === index ? styles.removeSubRow : ""
                                    }`}
                                >
                                    <div className={styles.apiLabel}>{apikey.label}</div>
                                    <div style={{ position: "relative" }} className={styles.apiKey}>
                                        {unmaskApiKey === apikey.key ? (
                                            <span>
                                                <img onClick={() => toggleApiKey(null)} src={EYE_HIDE} alt="hide" />
                                                {apikey.key}
                                            </span>
                                        ) : (
                                            <span>
                                                <img
                                                    src={EYE_SHOW}
                                                    onClick={() => toggleApiKey(apikey.key)}
                                                    alt="show"
                                                />
                                                ** ** ** ** ** ** ** ** ** {apikey.key.slice(-5)}
                                            </span>
                                        )}
                                        <img
                                            height={22}
                                            width={21}
                                            style={customStyles.copyBtn}
                                            src={CopyIcon}
                                            onClick={() => copyApiKey(apikey.key)}
                                            alt="copy"
                                        />
                                        {copied === apikey.key && (
                                            <SuccessBox override={true} style={customStyles.copied} message="Copied!" />
                                        )}
                                    </div>
                                    <div className={styles.apiCreated}>
                                        {format(new Date(apikey.created), "MMMM dd, yyyy")}
                                    </div>
                                    <div className={styles.unitsConsumed}>
                                        {apikey.units_consumed.toLocaleString("en-US")}
                                    </div>
                                    <div className={styles.apiLimit}>No Limit </div>
                                    <div className={styles.apiActions}>
                                        <button
                                            className={styles.setLimit}
                                            onClick={() => toggleUpdateLabelModal(apikey)}
                                        >
                                            Edit
                                        </button>
                                        <DeleteIcon
                                            style={customStyles.removeBtn}
                                            onClick={() => onClickRemoveApiKey(index)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.apiListFooter}>
                        <div className={styles.usageLabel}> Total usage </div>
                        <div className={styles.usageValue}>
                            <strong>
                                {totalUsage.toLocaleString("en-US", {
                                    maximumFractionDigits: 1,
                                })}
                            </strong>
                        </div>
                    </div>
                    <div className={styles.addDomain}>
                        <Button
                            title="+ Create API Key"
                            style={customStyles.addDomainBtn}
                            color="outline"
                            onClick={toggleAddLabelModal}
                        />
                    </div>
                    <div className={styles.messageSection}>
                        {errors.removeError && <ErrorBox error={errors.removeError} />}
                        {showSuccess.message && <SuccessBox message={showSuccess.message} />}
                    </div>
                    <div className={styles.zapIntegration}>
                        <h3 className={styles.subTitle}> Zapier API Integration </h3>
                        <p>
                            Fraud Blocker uses Zapier to automate our reporting data to your preferred dashboard.
                            <br />
                            Zapier allows you to instantly connect to over 7,000 different apps-no coding needed-making
                            it the most extensive automation platform in the world today.
                        </p>
                        <div className={styles.zapLinks}>
                            <a href="https://zapier.com/apps" target="_blank" rel="noopener noreferrer">
                                View Zapier's apps
                            </a>
                            <a
                                href="https://zapier.com/developer/public-invite/215613/ff5c0614c0994f7ddf5d1dc0ff6f7db0/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Sign up with Zapier
                            </a>
                            <a
                                href="https://zapier.com/apps/fraud-blocker/integrations"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Create a Zap
                            </a>
                        </div>
                    </div>
                    <div className={styles.popularZaps}>
                        <h3 className={styles.subTitle}>Popular Zapier "Zaps" for Fraud Blocker</h3>
                        <zapier-workflow
                            sign-up-email={auth?.user?.email}
                            sign-up-first-name={auth?.user?.first_name}
                            sign-up-last-name={auth?.user?.last_name}
                            client-id="9NGhfLuvyZCHahDE9Z7g8O4dodO35mhdwHWUp71S"
                            theme="auto"
                            intro-copy-display="hide"
                            manage-zaps-display="hide"
                            guess-zap-display="hide"
                            zap-create-from-scratch-display="show"
                        ></zapier-workflow>
                    </div>
                </div>
            </div>
            {showAddLabelModal && <AddApiKeyModal onClose={toggleAddLabelModal} onSuccess={onNewKeyAdded} />}
            {showUpdateLabelModal && selectedApiKey && (
                <UpdateApiKeyModal
                    onSuccess={onKeyUpdated}
                    onClose={toggleUpdateLabelModal}
                    id={selectedApiKey.id}
                    label={selectedApiKey.label}
                />
            )}
        </div>
    );
};

Api.propTypes = {
    accounts: PropTypes.object,
    activeDomain: PropTypes.object,
    auth: PropTypes.object,
    location: PropTypes.object,
    history: PropTypes.object,
};

const mapStateToProps = (state) => ({
    accounts: state.accounts,
    activeDomain: state.activeDomain,
    auth: state.auth,
});

export default connect(mapStateToProps)(Api);
