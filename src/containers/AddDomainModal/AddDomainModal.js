import React, { useState, useCallback } from "react";
import { parseDomain, fromUrl } from "parse-domain";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import styles from "./AddDomainModal.module.scss";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import Account from "../../redux/actions/Account";
import ActiveDomain from "../../redux/actions/ActiveDomain";
import Domains from "../../api/Domains";
import Utils from "../../utils/Utils";

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
    },
    inputStyle: {
        maxWidth: 400,
        alignSelf: "center",
        marginBottom: "30px",
        marginTop: "30px",
        width: "220px",
    },
    fieldError: {
        alignSelf: "center",
    },
};

const AddDomainModal = ({ isOpen, onSuccess, onCancel, forceToAdd, onCancelAccount }) => {
    const [state, setState] = useState({
        domain: "",
        loading: false,
        errors: {},
        existingDomain: null,
    });

    const accounts = useSelector((state) => state.accounts);
    const auth = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const handleCloseModal = useCallback(() => {
        if (onCancel) {
            setState((prev) => ({
                ...prev,
                domain: "",
            }));
            onCancel();
        }
    }, [onCancel]);

    const onInputChange = useCallback((event) => {
        const { value, name } = event.target;
        setState((prev) => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const onClickAddDomain = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            errors: {
                addDomain: "",
                apiError: "",
            },
            existingDomain: null,
        }));
        const { domain } = state;
        if (!accounts.data) {
            return;
        }
        const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
        if (!subscription) {
            setState((prev) => ({
                ...prev,
                errors: {
                    addDomain: "Please upgrade your plan to add a website",
                },
            }));
            return;
        }
        if (
            subscription.plan &&
            subscription.plan.metadata.domains !== "unlimited" &&
            accounts.data.domains.filter((item) => item.is_deleted === false).length >=
                subscription.plan.metadata.domains &&
            (!subscription.metadata.domain ||
                accounts.data.domains.filter((item) => item.is_deleted === false).length >=
                    parseInt(subscription.metadata.domain, 10))
        ) {
            setState((prev) => ({
                ...prev,
                errors: {
                    addDomain: "Please upgrade your plan to add new website",
                },
            }));
            return;
        }
        if (domain && domain.includes("@")) {
            setState((prev) => ({
                ...prev,
                errors: {
                    addDomain: "Please enter a valid domain",
                },
            }));
            return;
        }
        const parseResult = parseDomain(fromUrl(domain));
        if (parseResult) {
            if (parseResult.type !== "LISTED") {
                setState((prev) => ({
                    ...prev,
                    errors: {
                        addDomain: "The entered domain is not valid",
                    },
                }));
                return;
            }
        } else {
            setState((prev) => ({
                ...prev,
                errors: {
                    addDomain: "Please enter a valid domain",
                },
            }));
            return;
        }
        let parsedDomain = `${parseResult.icann.domain}.${parseResult.icann.topLevelDomains.join(".")}`;
        if (parseResult.icann.subDomains && parseResult.icann.subDomains.length) {
            const subDomains = parseResult.icann.subDomains.filter((name) => name.toLocaleLowerCase() !== "www");
            if (subDomains.length) {
                parsedDomain = `${subDomains.join(".")}.${parsedDomain}`;
            }
        }

        setState((prev) => ({
            ...prev,
            loading: true,
        }));
        console.log("Add domain: ", parsedDomain);

        const addDomainData = {
            domain_name: parsedDomain,
            account_id: accounts.data.id,
        };

        try {
            const domainExistsOnAccount = accounts.data.domains.find(
                (accountDomain) => parsedDomain === accountDomain.domain_name
            );

            if (domainExistsOnAccount) {
                if (domainExistsOnAccount.is_deleted) {
                    setState((prev) => ({
                        ...prev,
                        existingDomain: domainExistsOnAccount,
                    }));
                    throw new Error("removed");
                } else {
                    throw new Error("Website already exists on your account.");
                }
            }

            // let domainWithProtocol = parsedDomain;
            // if (!domainWithProtocol.includes('http')) {
            //   domainWithProtocol = `http://${domainWithProtocol}`;
            // }
            // const domainResponse = await UserApi.checkIfDomainActive(domainWithProtocol);
            // if (!domainResponse) {
            //   throw new Error('Error creating user account');
            // }

            const domainRes = await Domains.addDomain(addDomainData);

            window.Intercom("trackEvent", "add-domain", {
                domain: parsedDomain,
            });

            await dispatch(Account.fetchLatestAccount(accounts.data.id));

            window.Intercom("update", {
                user_id: auth.user.id,
                business_domain: accounts.data.domains.map((item) => item.domain_name).join(","),
            });

            setState((prev) => ({
                ...prev,
                loading: false,
            }));
            dispatch(ActiveDomain.setDomainActive(domainRes));
            if (onSuccess) {
                setState((prev) => ({
                    ...prev,
                    domain: "",
                }));
                onSuccess();
            }
        } catch (error) {
            setState((prev) => ({
                ...prev,
                errors: {
                    apiError: error.message,
                },
                loading: false,
            }));
        }
    }, [state.domain, accounts, auth, dispatch]);

    const restoreDomain = useCallback(async () => {
        if (!state.existingDomain || state.loading) {
            return;
        }

        setState((prev) => ({
            ...prev,
            loading: true,
        }));
        try {
            const response = await Domains.restoreDomain(state.existingDomain.id);

            window.Intercom("trackEvent", "add-domain", {
                domain: state.existingDomain.domain_name,
            });

            await dispatch(Account.fetchLatestAccount(accounts.data.id));

            window.Intercom("update", {
                user_id: auth.user.id,
                business_domain: accounts.data.domains.map((item) => item.domain_name).join(","),
            });

            setState((prev) => ({
                ...prev,
                loading: false,
                existingDomain: null,
            }));
            dispatch(ActiveDomain.setDomainActive(response));
            if (onSuccess) {
                setState((prev) => ({
                    ...prev,
                    domain: "",
                }));
                onSuccess();
            }
        } catch (error) {
            setState((prev) => ({
                ...prev,
                errors: {
                    apiError: error.message,
                },
                loading: false,
            }));
        }
    }, [state.existingDomain, state.loading, accounts, auth, dispatch]);

    return (
        <Modal isOpen={isOpen} style={customStyles} contentLabel="Add Website Modal" ariaHideApp={false}>
            <div className={styles.container}>
                {!forceToAdd && (
                    <span className={styles.closeBtn} onClick={handleCloseModal} aria-hidden="true">
                        ×
                    </span>
                )}
                <div className={styles.content}>
                    <p className={styles.addNewDomainText}>Add New Website</p>
                    <div>
                        {!forceToAdd ? (
                            <p className={styles.descriptionText}>
                                To begin fraud detection on a new website, enter the domain address.
                            </p>
                        ) : (
                            <p className={styles.mustAddText}>
                                You do not have any active website in your account. Please add a new website below or{" "}
                                <a onClick={onCancelAccount}>go here</a> to cancel your entire account.
                            </p>
                        )}
                    </div>
                    <Input
                        onChange={onInputChange}
                        value={state.domain}
                        name="domain"
                        style={customStyles.inputStyle}
                        placeholder="example.com"
                    />
                    {state.errors.addDomain && <ErrorBox error={state.errors.addDomain} />}
                    {state.errors.apiError && !state.errors.apiError.includes("removed") && (
                        <ErrorBox error={state.errors.apiError} />
                    )}
                    {state.errors.apiError &&
                        state.errors.apiError.includes("removed") &&
                        (state.loading && state.existingDomain ? (
                            <ErrorBox error="Restoring" />
                        ) : (
                            <ErrorBox
                                error={
                                    <div>
                                        Website exists in your deleted domains. Please{" "}
                                        <a
                                            style={{
                                                color: "#fc584e",
                                                textDecoration: "underline",
                                            }}
                                            href={null}
                                            onClick={restoreDomain}
                                        >
                                            restore it.
                                        </a>
                                    </div>
                                }
                            />
                        ))}
                    <Button
                        onClick={onClickAddDomain}
                        title="Add Website"
                        loading={state.loading}
                        color="lt-blue"
                        style={customStyles.addDomainBtn}
                        disabled={!state.domain}
                    />
                </div>
            </div>
        </Modal>
    );
};

AddDomainModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    accounts: PropTypes.object,
    auth: PropTypes.object,
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func,
    forceToAdd: PropTypes.bool,
    onCancelAccount: PropTypes.func,
};

export default AddDomainModal;
