import React, { useState, useEffect, useCallback } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PropTypes from "prop-types";
import { Tooltip as ReactTooltip } from "react-tooltip";
import moment from "moment";
import styles from "./Account.module.scss";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import SuccessBox from "../../components/SuccessBox/SuccessBox";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import Account from "../../redux/actions/Account";
import Validation from "../../utils/Validation";
import Utils from "../../utils/Utils";
import Constants from "../../utils/Constants";
import Dropdown from "../../components/Dropdown/Dropdown";
import Payments from "../../api/Payments";
import { ReactComponent as DeleteIcon } from "../../assets/delete-icon.svg";
import { ReactComponent as TooltipIcon } from "../../assets/tooltip.svg";
import AddressForm from "./AddressForm";

const customStyles = {
    title: {
        marginBottom: 50,
    },
    subTitle: {
        marginBottom: 30,
    },
    editInput: {},
    inputContainer: {
        flex: 1,
        marginRight: 38,
        marginBottom: 30,
    },
    emailInputContainer: {
        flex: 1,
        marginBottom: 20,
    },
    inputsContainer: {
        display: "flex",
        alignItems: "stretch",
    },
    taxInputsContainer: {
        display: "flex",
        alignItems: "stretch",
        maxWidth: "700px",
    },
    singleField: {
        maxWidth: "662px",
    },
    saveBtn: {
        maxWidth: 110,
        marginTop: 20,
    },
    divider: {
        width: "100%",
        height: 1,
        backgroundColor: "#eaedf3",
        marginTop: 30,
        marginBottom: 30,
    },
    dividerShort: {
        maxWidth: "662px",
    },
    switchContainer: {
        display: "flex",
        alignItems: "center",
    },
    switchText: {
        marginLeft: 10,
    },
    table: {
        marginTop: 0,
    },
    link: {
        color: "#1660ff",
        fontWeight: "normal",
        textDecoration: "underline",
    },
    taxCountry: {
        fontSize: "14px",
        marginLeft: "10px",
        color: "#4a4a4a",
    },
    addTaxIdBtn: {
        minWidth: 140,
        marginRight: 15,
        border: "none",
        fontWeight: "normal",
        color: "#286cff",
        marginBottom: "20px",
    },
    deleteAction: {
        display: "flex",
        alignItems: "center",
    },
    deleteBtn: {
        cursor: "pointer",
        marginTop: "-5px",
    },
};

const stripeFormAppearance = {
    rules: {
        ".Input": {
            boxSizing: "border-box",
            padding: "10px 18px",
            border: "solid 1px #c9cdd8",
            boxShadow: "none",
        },
        ".Label": {
            marginBottom: "10px",
            textTransform: "capitalize",
        },
        ".Input:hover": {
            outline: "#279cf8 auto 1px",
            boxShadow: "0 0 0.6pt 0.6pt #c9cdd8",
        },
        ".Input:focus": {
            boxShadow: "none",
        },
    },
    labels: "above",
    variables: {
        fontSizeSm: "14px",
        colorPrimary: "#0570de",
        colorBackground: "#F0F4F8",
        colorText: "#4a4a4a",
        colorDanger: "#df1b41",
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
        borderRadius: "4px",
        spacingGridRow: "20px",
    },
};

const TAX_ID_TYPE_OPTIONS = Constants.countryTaxIdOptions.map((option) => ({
    label: (
        <span
            style={{
                color: "#2b2c33",
            }}
        >
            {option.code} {option.enum.toUpperCase()}
            <span style={customStyles.taxCountry}> {option.country} </span>
        </span>
    ),
    value: `<span class="math-inline">\{option\.code\}\_</span>{option.enum}`,
    icon: `../../flags/${option.code.toLowerCase()}.svg`,
}));

const stripe = loadStripe(Constants.stripePublicKey);

const Invoices = () => {
    const dispatch = useDispatch();
    const accounts = useSelector((state) => state.accounts);

    const [billingName, setBillingName] = useState(accounts.subscription ? accounts.subscription.name : "");
    const [billingEmail, setBillingEmail] = useState(accounts.data.billing_email);
    const [billingAddress, setBillingAddress] = useState(accounts.data.billing_address);
    const [billingAddress2, setBillingAddress2] = useState(accounts.data.billing_address_2);
    const [billingCountry, setBillingCountry] = useState(
        accounts.subscription && accounts.subscription.address ? accounts.subscription.address.country : "US"
    );
    const [city, setCity] = useState(accounts.data.billing_city);
    const [state, setState] = useState(accounts.data.billing_state);
    const [zip, setZip] = useState(accounts.data.billing_zip);
    const [newTaxIds, setNewTaxIds] = useState(
        !accounts.subscription || !accounts.subscription.tax_ids || !accounts.subscription.tax_ids.data.length
            ? [
                  {
                      type: "",
                      value: "",
                  },
              ]
            : []
    );
    const [taxIdsToBeDeleted, setTaxIdsToBeDeleted] = useState([]);
    const [sendNotifications, setSendNotifications] = useState(true); //Not used
    const [invoices, setInvoices] = useState([]);
    const [invoicesError, setInvoicesError] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showTaxSuccess, setShowTaxSuccess] = useState(false);

    const existingTaxIds =
        accounts.subscription && accounts.subscription.tax_ids && accounts.subscription.tax_ids.data.length
            ? accounts.subscription.tax_ids.data.map((taxId) => ({
                  id: taxId.id,
                  type: `<span class="math-inline">\{taxId\.country\}\_</span>{taxId.type}`,
                  value: taxId.value,
              }))
            : [];

    useEffect(() => {
        const getAllInvoices = async () => {
            const customerId = accounts.data.stripe_token;
            const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);
            if (subscription) {
                try {
                    const result = await Payments.getAllCustomerInvoices(customerId, subscription.id);
                    if (result) {
                        setInvoices(result.data);
                        setInvoicesError({});
                        return;
                    }
                } catch (error) {
                    console.log(error);
                    setInvoicesError({
                        error: error.message,
                    });
                    return;
                }
            }

            setInvoicesError({
                error: "No subscription found",
            });
        };
        getAllInvoices();
        ReactTooltip.rebuild();
    }, [accounts]);

    useEffect(() => {
        if (accounts.subscription && accounts.data) {
            setBillingName(accounts.subscription.name || "");
            setBillingEmail(accounts.data.billing_email);
            setBillingAddress(accounts.subscription.address.line1);
            setBillingAddress2(accounts.subscription.address.line2);
            setBillingCountry(accounts.subscription.address.country || "US");
            setCity(accounts.subscription.address.city);
            setState(accounts.subscription.address.state);
            setZip(accounts.subscription.address.postal_code);
            setNewTaxIds(
                !accounts.subscription || !accounts.subscription.tax_ids || !accounts.subscription.tax_ids.data.length
                    ? [
                          {
                              type: "",
                              value: "",
                          },
                      ]
                    : []
            );
        }
    }, [accounts.subscription, accounts.data]);

    const onInputChange = useCallback((event) => {
        const { value, name } = event.target;
        if (name === "billingEmail") {
            setBillingEmail(value);
        } else if (name === "billingAddress") {
            setBillingAddress(value);
        } else if (name === "billingAddress2") {
            setBillingAddress2(value);
        } else if (name === "city") {
            setCity(value);
        } else if (name === "state") {
            setState(value);
        } else {
            setZip(value);
        }
    }, []);

    // const onSwitchChange = useCallback((name) => { // Not used
    //   setSendNotifications((prev) => !prev);
    // }, []);

    const onBillingStateChange = useCallback((selectedOption) => {
        setState({
            value: selectedOption.value,
            label: selectedOption.label,
        });
    }, []);

    const onTaxIdTypeChange = useCallback(
        (selectedOption, index) => {
            const updatedTaxIds = [...newTaxIds];
            updatedTaxIds[index] = {
                ...updatedTaxIds[index],
                type: selectedOption.value,
            };
            setNewTaxIds(updatedTaxIds);
        },
        [newTaxIds]
    );

    const onTaxIdValueChange = useCallback(
        (event, index) => {
            const { value } = event.target;
            const updatedTaxIds = [...newTaxIds];
            updatedTaxIds[index] = {
                ...updatedTaxIds[index],
                value: value,
            };
            setNewTaxIds(updatedTaxIds);
        },
        [newTaxIds]
    );

    const onAddressChange = useCallback((event) => {
        if (event.complete) {
            // Extract potentially complete address
            const { address, name } = event.value;
            console.log(address);
            setBillingAddress(address.line1);
            setBillingAddress2(address.line2);
            setCity(address.city);
            setState(address.state);
            setZip(address.postal_code);
            setBillingName(name);
            setBillingCountry(address.country);
        }
    }, []);

    const onClickSaveBtn = useCallback(async () => {
        setShowSuccess(false);
        setLoading(true);

        const requiredData = {
            billingEmail,
            billingAddress,
            billingCountry,
            city,
            state,
            zip,
        };

        // const newErrors = Validation.validateForm(requiredData); // No longer using external validation
        // if (newErrors) {
        //   setErrors(newErrors);
        //   setLoading(false);
        //   console.log('invalidForm: ', newErrors);
        //   return;
        // }

        const updateData = {
            billing_email: requiredData.billingEmail || "",
            billing_address: requiredData.billingAddress || "",
            billing_address_2: billingAddress2 || "",
            billing_city: requiredData.city || "",
            billing_state: requiredData.state || "",
            billing_zip: requiredData.zip || "",
        };

        const stripeUpdateData = {
            name: billingName || "",
            address: {
                line1: billingAddress || "",
                city: city || "",
                line2: billingAddress2 || "",
                postal_code: zip || "",
                state: state || "",
                country: billingCountry || "",
            },
        };

        try {
            const result = await dispatch(Account.updateUserAccount(accounts.data.id, updateData));
            const stripeResult = await Payments.updateCustomer(accounts.data.stripe_token, stripeUpdateData);
            if (result && stripeResult) {
                fetchLatestSubscriptionInfo();
                setErrors({});
                setShowSuccess(true);
            }
        } catch (error) {
            console.log(error);
            setErrors({ save: error.message });
        } finally {
            setLoading(false);
        }
    }, [
        billingEmail,
        billingAddress,
        billingAddress2,
        city,
        state,
        zip,
        billingName,
        billingCountry,
        accounts.data.id,
        accounts.data.stripe_token,
        dispatch,
    ]);

    const onAddTaxIdClick = useCallback(() => {
        setNewTaxIds((prevTaxIds) => [
            ...prevTaxIds,
            {
                type: "",
                value: "",
            },
        ]);
    }, []);

    const onRemoveTaxId = useCallback((id) => {
        setTaxIdsToBeDeleted((prevIds) => [...prevIds, id]);
    }, []);

    const validateNewTaxIds = useCallback(() => {
        const taxErrors = [];
        for (let i = 0; i < newTaxIds.length; i += 1) {
            const newError = Validation.validateForm(newTaxIds[i]);
            if (newError) {
                taxErrors.push(newError);
            }
        }
        return taxErrors.length === 0;
    }, [newTaxIds]);

    const onClickTaxSaveBtn = useCallback(async () => {
        const requiredData = {};

        if (newTaxIds.length) {
            if (!validateNewTaxIds()) {
                return;
            }
            requiredData.newTaxIds = newTaxIds.map((taxId) => ({
                type: `<span class="math-inline">\{taxId\.type\.split\('\_'\)\[1\]\}\_</span>{taxId.type.split('_')[2]}`,
                value: taxId.value,
            }));
        }

        if (taxIdsToBeDeleted.length) {
            requiredData.deleteTaxIds = taxIdsToBeDeleted;
        }

        if (!Object.keys(requiredData).length) {
            return;
        }

        setShowSuccess(false);
        setLoading(true);

        try {
            const stripeResult = await Payments.updateCustomer(accounts.data.stripe_token, requiredData);
            if (stripeResult) {
                await fetchLatestSubscriptionInfo();
                setErrors({});
                setShowTaxSuccess(true);
                setTaxIdsToBeDeleted([]);
                setNewTaxIds(
                    (!requiredData.newTaxIds || !requiredData.newTaxIds.length) &&
                        (!existingTaxIds.length || existingTaxIds.length === taxIdsToBeDeleted.length)
                        ? [
                              {
                                  type: "",
                                  value: "",
                              },
                          ]
                        : []
                );
            }
        } catch (error) {
            console.log(error);
            setErrors({ saveTax: error.message });
        } finally {
            setLoading(false);
        }
    }, [
        newTaxIds,
        taxIdsToBeDeleted,
        accounts.data.stripe_token,
        existingTaxIds,
        validateNewTaxIds,
        dispatch,
        accounts.data.id,
    ]);

    const fetchLatestSubscriptionInfo = useCallback(async () => {
        try {
            await dispatch(Account.getUserSubscriptions(accounts.data.stripe_token, true));
        } catch (error) {
            console.log(error);
        }
    }, [dispatch, accounts.data.stripe_token]);

    const getSelectedTaxIdTypeObject = useCallback((type) => {
        return type ? TAX_ID_TYPE_OPTIONS.find((option) => option.value === type) : "";
    }, []);

    const getTaxIdValuePlaceHolder = useCallback(
        (index) => {
            if (newTaxIds[index].type) {
                return Constants.countryTaxIdOptions.find(
                    (option) =>
                        `<span class="math-inline">\{option\.code\}\_</span>{option.enum}` === newTaxIds[index].type
                ).pattern;
            }
            return "";
        },
        [newTaxIds]
    );

    const isTaxIdChangeDisabled = useCallback(() => {
        return !taxIdsToBeDeleted.length && (!newTaxIds.length || !validateNewTaxIds());
    }, [taxIdsToBeDeleted.length, newTaxIds, validateNewTaxIds]);

    return (
        <div className={styles.content}>
            <h1 style={customStyles.title} className={styles.title}>
                Invoices
            </h1>
            <ReactTooltip
                effect="solid"
                delayHide={500}
                delayUpdate={500}
                className={styles.emailChangeTooltip}
                id="emailChangeInvoice"
            >
                To change your account email, please{" "}
                <a href="mailto:info@fraudblocker.com?subject=Change Account Email Address">email</a> our support team.
            </ReactTooltip>
            <h3 style={customStyles.subTitle} className={styles.subTitle}>
                Billing Information
            </h3>
            <p style={{ marginBottom: "10px" }}>
                Account Email
                <TooltipIcon className={styles.emailChangeTip} data-tip data-for="emailChangeInvoice" />
            </p>
            <div style={{ ...customStyles.taxInputsContainer, ...customStyles.singleField }}>
                <Input
                    containerStyle={customStyles.emailInputContainer}
                    onChange={onInputChange}
                    value={billingEmail}
                    name="billingEmail"
                    disabled={true}
                />
            </div>
            <div className={styles.stripeWrapper}>
                <Elements
                    stripe={stripe}
                    options={{
                        appearance: stripeFormAppearance,
                    }}
                >
                    <AddressForm
                        onAddressChange={onAddressChange}
                        values={{
                            address: {
                                line1: billingAddress,
                                line2: billingAddress2,
                                city: city,
                                state: state,
                                postal_code: zip,
                                country: billingCountry,
                            },
                            name: billingName,
                        }}
                    />
                </Elements>
            </div>
            {showSuccess && (
                <div>
                    <SuccessBox message="Billing information updated" />
                </div>
            )}
            {errors.save && (
                <div>
                    <ErrorBox error={errors.save} />
                </div>
            )}
            <Button
                title="Save"
                color="lt-blue-auto"
                style={customStyles.saveBtn}
                loading={loading}
                onClick={onClickSaveBtn}
            />
            <div style={{ ...customStyles.divider, ...customStyles.dividerShort }} />
            <h3 style={customStyles.subTitle} className={styles.subTitle}>
                Value-Added Tax (VAT) Information
            </h3>
            {existingTaxIds
                .filter((taxId) => !taxIdsToBeDeleted.includes(taxId.id))
                .map((taxId, index) => {
                    return (
                        <div key={taxId.id} style={customStyles.taxInputsContainer}>
                            <Dropdown
                                containerStyle={customStyles.inputContainer}
                                options={TAX_ID_TYPE_OPTIONS}
                                onOptionChange={() => {}}
                                label="Billing Country Or Region"
                                value={getSelectedTaxIdTypeObject(taxId.type)}
                                disabled={true}
                            />
                            <Input
                                containerStyle={customStyles.inputContainer}
                                style={customStyles.editInput}
                                onChange={() => {}}
                                label="VAT Number"
                                value={taxId.value}
                                disabled={true}
                                name="taxIdValue"
                                error={errors.taxIdValue} // Assuming you might have errors here
                            />
                            <p style={customStyles.deleteAction}>
                                <DeleteIcon style={customStyles.deleteBtn} onClick={() => onRemoveTaxId(taxId.id)} />
                            </p>
                        </div>
                    );
                })}
            {newTaxIds.map((newTaxId, index) => {
                return (
                    <div key={index} style={customStyles.taxInputsContainer}>
                        <Dropdown
                            containerStyle={customStyles.inputContainer}
                            options={TAX_ID_TYPE_OPTIONS}
                            onOptionChange={(val) => onTaxIdTypeChange(val, index)}
                            label="Billing Country Or Region"
                            value={getSelectedTaxIdTypeObject(newTaxId.type)}
                        />
                        <Input
                            containerStyle={customStyles.inputContainer}
                            style={customStyles.editInput}
                            onChange={(e) => onTaxIdValueChange(e, index)}
                            label="VAT Number"
                            value={newTaxId.value}
                            name="value"
                            error={errors.taxIdValue} // Keep this in case you have validation
                            placeholder={getTaxIdValuePlaceHolder(index)}
                        />
                    </div>
                );
            })}
            <div className={styles.taxIdsBtnContainer}>
                <Button
                    onClick={onAddTaxIdClick}
                    style={customStyles.addTaxIdBtn}
                    color="outline"
                    title="+ Add Tax ID"
                />
                <Button
                    title="Save"
                    color="lt-blue-auto"
                    loading={loading}
                    disabled={isTaxIdChangeDisabled()}
                    onClick={onClickTaxSaveBtn}
                />
            </div>
            {showTaxSuccess && (
                <div>
                    <SuccessBox message="VAT information has been updated" />
                </div>
            )}
            {errors.saveTax && (
                <div>
                    <ErrorBox error={errors.saveTax} />
                </div>
            )}
            <div style={customStyles.divider} />
            <h3 className={styles.subTitle}> Invoice History </h3>
            <section style={customStyles.table}>
                <header className={styles.tableRow}>
                    <div className={styles.tableColumn}>
                        <h3> ID </h3>
                    </div>
                    <div className={styles.tableColumn}>
                        <h3> Date </h3>
                    </div>
                    <div className={styles.tableColumn}>
                        <h3> Amount </h3>
                    </div>
                    <div className={styles.tableColumn}>
                        <h3> Status </h3>
                    </div>
                    <div className={styles.tableColumn} />
                </header>
                {invoicesError.error && <ErrorBox error={invoicesError.error} />}
                {!invoicesError.error && invoices.length < 1 ? (
                    <p> Sorry no invoice history found </p>
                ) : (
                    invoices.map((invoice) => {
                        // removed index
                        return (
                            <div key={invoice.id} className={styles.tableRow}>
                                <div className={styles.tableColumn}>
                                    <p> {invoice.id} </p>
                                </div>
                                <div className={styles.tableColumn}>
                                    <p> {`${moment.unix(invoice.created).format("L")}`} </p>
                                </div>
                                <div className={styles.tableColumn}>
                                    <p> {`$${invoice.total / 100}`} </p>
                                </div>
                                <div className={styles.tableColumn}>
                                    <p> {`${invoice.status.toUpperCase()}`} </p>
                                </div>
                                <div className={styles.tableColumn}>
                                    <a
                                        href={invoice.invoice_pdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={customStyles.link}
                                    >
                                        Download Invoice
                                    </a>
                                </div>
                            </div>
                        );
                    })
                )}
            </section>
        </div>
    );
};

Invoices.propTypes = {
    // updateUserAccount: PropTypes.func, // Now handled via useDispatch
    // getUserSubscriptions: PropTypes.func, // Now handled via useDispatch
    accounts: PropTypes.object,
    activeDomain: PropTypes.object, // Still used, so keep it
};

const mapStateToProps = (state) => ({
    accounts: state.accounts,
    activeDomain: state.activeDomain,
});

// No need for mapDispatchToProps anymore

export default connect(mapStateToProps)(Invoices);
