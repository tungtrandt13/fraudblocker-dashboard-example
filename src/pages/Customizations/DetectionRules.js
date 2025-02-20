import React, { useState, useEffect, useCallback } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import styles from "./Customizations.module.scss";
import Input from "../../components/Input/Input";
import Dropdown from "../../components/Dropdown/Dropdown";
import Button from "../../components/Button/Button";
import Switch from "../../components/Switch/Switch";
import ActiveDomain from "../../redux/actions/ActiveDomain";
import Constants from "../../utils/Constants";
import ArrowRight from "../../assets/dropdown-arrow.svg";
import OrbitIcon from "../../assets/orbit.svg";
import TargetIcon from "../../assets/target.svg";
import { ReactComponent as DeleteIcon } from "../../assets/delete-icon.svg";
import SuccessBox from "../../components/SuccessBox/SuccessBox";

const customStyles = {
    input: {
        width: 100,
        height: 36,
        marginLeft: 15,
        marginRight: 15,
    },
    dropdown: {
        width: 100,
        height: 36,
    },
    addThresholdBtn: {
        minWidth: 140,
        marginRight: 15,
        border: "none",
        fontWeight: "normal",
        color: "#286cff",
        marginBottom: "20px",
    },
    saveThresholdsBtn: {
        height: "41px",
    },
    deleteBtn: {
        minWidth: 0,
        paddingLeft: 10,
        paddingRight: 10,
        cursor: "pointer",
    },
    saved: {
        maxWidth: "200px",
        marginLeft: "10px",
        fontWeight: "600",
        padding: "10px 15px",
        marginTop: 0,
        marginBottom: 0,
    },
};

const { countryNameMapping } = Constants;

const dropdownOptions = [
    { value: "5m", label: "5 minutes" },
    { value: "1h", label: "1 hour" },
    { value: "24h", label: "1 day" },
];

const countryOptions = Object.entries(countryNameMapping)
    .map(([key, val]) => ({
        label: val,
        value: key,
        icon: `/flags/${key.toLowerCase()}.svg`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

const DetectionRules = () => {
    const [state, setState] = useState({
        clickFraudThresholds: {
            "5m": "",
        },
        detectIPs: true,
        vpnBlocking: true,
        monitorOnlyMode: false,
        aggressiveBlocking: false,
        blockAccidental: true,
        abusiveIPs: true,
        saved: false,
        removeThresholdClass: false,
        isSaveClicked: false,
        isThresholdOpen: false,
        isGeoBlockingOpen: false,
        geoToggleState: "allowed",
        geoStateSaveClicked: false,
        allowedCountries: [],
        blockedCountries: [],
    });

    const activeDomain = useSelector((state) => state.activeDomain);
    const accounts = useSelector((state) => state.accounts);
    const dispatch = useDispatch();

    const setStateData = useCallback(() => {
        const {
            click_fraud_thresholds: clickFraudThresholds,
            detect_ips: detectIPs,
            vpn_blocking: vpnBlocking,
            monitoring_only: monitorOnlyMode,
            aggressive_blocking: aggressiveBlocking,
            block_accidental: blockAccidental,
            abusive_ips: abusiveIPs,
            allowed_countries: allowedCountries,
            blocked_countries: blockedCountries,
        } = activeDomain.data || {};

        setState({
            clickFraudThresholds:
                !clickFraudThresholds ||
                Array.isArray(clickFraudThresholds) ||
                (!Array.isArray(clickFraudThresholds) &&
                    typeof clickFraudThresholds === "object" &&
                    !Object.keys(clickFraudThresholds).length)
                    ? {
                          "5m": "",
                      }
                    : clickFraudThresholds,
            detectIPs: typeof detectIPs === "undefined" ? true : detectIPs,
            vpnBlocking: typeof vpnBlocking === "undefined" ? true : vpnBlocking,
            blockAccidental: typeof blockAccidental === "undefined" ? true : blockAccidental,
            abusiveIPs: typeof abusiveIPs === "undefined" || abusiveIPs === null ? true : abusiveIPs,
            allowedCountries: allowedCountries ? allowedCountries.split("_") : [],
            blockedCountries: blockedCountries ? blockedCountries.split("_") : [],
            monitorOnlyMode,
            aggressiveBlocking,
            saved: false,
            removeThresholdClass: false,
            isSaveClicked: false,
            geoStateSaveClicked: false,
            geoToggleState: blockedCountries ? "blocked" : "allowed",
        });
    }, [activeDomain.data]);

    // Thay componentDidMount
    useEffect(() => {
        if (activeDomain && activeDomain.data) {
            setStateData();
        }
    }, [activeDomain.data, setStateData]); // Dependency array bao gồm activeDomain.data

    // Thay componentDidUpdate
    useEffect(() => {
        if (activeDomain && activeDomain.isUpdating && !activeDomain.error && !state.saved) {
            setState((prev) => ({
                ...prev,
                saved: true,
            }));
        }
        if (activeDomain && activeDomain.data && activeDomain.data.id) {
            setStateData();
        }
    }, [activeDomain.isUpdating, activeDomain.error, activeDomain.data, state.saved, setStateData]);

    const onInputChange = useCallback(
        (value, key) => {
            const newClickThresholds = { ...state.clickFraudThresholds };
            newClickThresholds[key] = value;

            setState((prev) => ({
                ...prev,
                clickFraudThresholds: newClickThresholds,
            }));
        },
        [state.clickFraudThresholds]
    );

    const onOptionChange = useCallback(
        (selected, key) => {
            if (state.clickFraudThresholds[selected.value]) {
                return;
            }
            const newClickThresholds = { ...state.clickFraudThresholds };
            delete newClickThresholds[key];
            newClickThresholds[selected.value] = "";

            setState((prev) => ({
                ...prev,
                clickFraudThresholds: newClickThresholds,
            }));
        },
        [state.clickFraudThresholds]
    );

    const onSwitchChange = useCallback(
        (name) => {
            if (!accounts.subscriptionValid) {
                return;
            }
            setState(
                (prev) => ({
                    ...prev,
                    [name]: !prev[name],
                    isSaveClicked: false,
                }),
                () => {
                    if (activeDomain.data.id) {
                        dispatch(
                            ActiveDomain.updateDomain(
                                activeDomain.data.id,
                                {
                                    id: activeDomain.data.id,
                                    detect_ips: prev.detectIPs,
                                    vpn_blocking: prev.vpnBlocking,
                                    monitoring_only: prev.monitorOnlyMode,
                                    aggressive_blocking: prev.aggressiveBlocking,
                                    block_accidental: prev.blockAccidental,
                                    abusive_ips: prev.abusiveIPs,
                                },
                                true
                            )
                        );
                    }
                }
            );
        },
        [accounts.subscriptionValid, activeDomain.data.id, dispatch]
    );

    const onAddThresholdClick = useCallback(() => {
        const newClickThresholds = { ...state.clickFraudThresholds };
        if (newClickThresholds["5m"] === undefined) {
            newClickThresholds["5m"] = "";
        } else if (newClickThresholds["1h"] === undefined) {
            newClickThresholds["1h"] = "";
        } else if (newClickThresholds["24h"] === undefined) {
            newClickThresholds["24h"] = "";
        }
        setState((prev) => ({
            ...prev,
            clickFraudThresholds: newClickThresholds,
        }));
    }, [state.clickFraudThresholds]);

    const onRemoveThreshold = useCallback(
        (key) => {
            setState((prev) => ({
                ...prev,
                removeThresholdClass: key,
            }));
            setTimeout(() => {
                const newClickThresholds = { ...state.clickFraudThresholds };
                delete newClickThresholds[key];
                setState((prev) => ({
                    ...prev,
                    clickFraudThresholds: newClickThresholds,
                    removeThresholdClass: "",
                }));
            }, 200);
        },
        [state.clickFraudThresholds]
    );

    const isSaveDisabled = useCallback(() => {
        return Object.values(state.clickFraudThresholds).some((value) => !value);
    }, [state.clickFraudThresholds]);

    const onSaveThresholds = useCallback(() => {
        if (isSaveDisabled()) {
            return;
        }
        setState((prev) => ({
            ...prev,
            saved: false,
            isSaveClicked: true,
        }));
        if (activeDomain.data.id) {
            dispatch(
                ActiveDomain.updateDomain(activeDomain.data.id, {
                    id: activeDomain.data.id,
                    click_fraud_thresholds: state.clickFraudThresholds,
                })
            );
        }
    }, [activeDomain.data.id, isSaveDisabled, state.clickFraudThresholds, dispatch]);

    const handleSaveGeoBlocking = useCallback(() => {
        setState((prev) => ({
            ...prev,
            geoStateSaveClicked: true,
            saved: false,
        }));
        if (activeDomain.data.id) {
            dispatch(
                ActiveDomain.updateDomain(activeDomain.data.id, {
                    id: activeDomain.data.id,
                    allowed_countries: state.allowedCountries.length ? state.allowedCountries.join("_") : null,
                    blocked_countries: state.blockedCountries.length ? state.blockedCountries.join("_") : null,
                })
            );
        }
    }, [activeDomain.data.id, state.allowedCountries, state.blockedCountries, dispatch]);

    const onGeoStateToggleChange = useCallback((event) => {
        setState((prev) => ({
            ...prev,
            geoToggleState: event.target.value,
        }));
    }, []);

    const handleCountrySelect = useCallback(
        (selected) => {
            if (state.geoToggleState === "allowed") {
                setState((prev) => ({
                    ...prev,
                    allowedCountries: prev.allowedCountries.includes(selected.value)
                        ? prev.allowedCountries
                        : [...prev.allowedCountries, selected.value],
                }));
            }
            if (state.geoToggleState === "blocked") {
                setState((prev) => ({
                    ...prev,
                    blockedCountries: prev.blockedCountries.includes(selected.value)
                        ? prev.blockedCountries
                        : [...prev.blockedCountries, selected.value],
                }));
            }
        },
        [state.geoToggleState]
    );

    const handleCountryRemove = useCallback(
        (country) => {
            if (state.geoToggleState === "allowed") {
                setState((prev) => ({
                    ...prev,
                    allowedCountries: prev.allowedCountries.filter((item) => item !== country),
                }));
            }
            if (state.geoToggleState === "blocked") {
                setState((prev) => ({
                    ...prev,
                    blockedCountries: prev.blockedCountries.filter((item) => item !== country),
                }));
            }
        },
        [state.geoToggleState]
    );

    const {
        clickFraudThresholds,
        vpnBlocking,
        monitorOnlyMode,
        aggressiveBlocking,
        saved,
        removeThresholdClass,
        isSaveClicked,
        blockAccidental,
        abusiveIPs,
        isThresholdOpen,
        isGeoBlockingOpen,
        geoToggleState,
        allowedCountries,
        blockedCountries,
        geoStateSaveClicked,
    } = state;

    const isMaxThresholdAdded = clickFraudThresholds["5m"] && clickFraudThresholds["1h"] && clickFraudThresholds["24h"];

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Manage Detection Rules</h1>
            <h2 className={styles.sectionHead}>
                <img alt="target" src={TargetIcon} />
                TARGETED ADJUSTMENTS
            </h2>
            <h3
                style={{ cursor: "pointer" }}
                onClick={() =>
                    setState((prev) => ({
                        ...prev,
                        isGeoBlockingOpen: !prev.isGeoBlockingOpen,
                    }))
                }
            >
                Geo-Blocking By Country
            </h3>
            <p
                style={{ cursor: "pointer" }}
                onClick={() =>
                    setState((prev) => ({
                        ...prev,
                        isGeoBlockingOpen: !prev.isGeoBlockingOpen,
                    }))
                }
                className={`${styles.fraudThresholdDesc} ${styles.switchOptionContainer}`}
            >
                This feature allows you to determine which countries you would like to allow or block from your ad
                campaigns.
                <img
                    className={`${styles.expandIcon} ${!isGeoBlockingOpen && styles.expandIconClosed}`}
                    src={ArrowRight}
                />
            </p>
            <div
                className={`${styles.thresholdWrapperHidden} ${styles.extraGutter} ${isGeoBlockingOpen ? styles.active : ""}`}
            >
                <div className={`${styles.switchOptionContainer} ${styles.geoBlocking}`}>
                    <div style={{ width: "100%" }}>
                        <div className={styles.geoBlockRadio}>
                            <div className={styles.heading}>
                                <div className={styles.radioItem}>
                                    <input
                                        type="radio"
                                        name="geoBlocking"
                                        value="blocked"
                                        id="radio_geo_blocked"
                                        onChange={onGeoStateToggleChange}
                                        defaultChecked={geoToggleState === "blocked"}
                                        checked={geoToggleState === "blocked"}
                                    />
                                </div>
                                <strong>Block</strong> all ad clicks coming from the countries listed below, or
                            </div>
                            <div className={styles.heading}>
                                <div className={styles.radioItem}>
                                    <input
                                        type="radio"
                                        name="geoBlocking"
                                        value="allowed"
                                        id="radio_geo_allowed"
                                        onChange={onGeoStateToggleChange}
                                        defaultChecked={geoToggleState === "allowed"}
                                        checked={geoToggleState === "allowed"}
                                    />
                                </div>
                                <strong>Allow</strong> ad clicks coming from the countries listed below and block all
                                others
                            </div>
                        </div>
                        <div className={styles.geoBlockDesc}>
                            <div className={styles.countryDropdown}>
                                <Dropdown
                                    options={countryOptions}
                                    selectClass={styles.userDomainDropdown}
                                    value={null}
                                    name="duration"
                                    onOptionChange={handleCountrySelect}
                                    placeholder="Select a country"
                                />
                            </div>
                            <ul className={styles.selectedCountryList}>
                                {geoToggleState === "blocked"
                                    ? blockedCountries.map((item) => (
                                          <li key={item}>
                                              <span>{countryNameMapping[item]}</span>
                                              <span
                                                  onClick={() => handleCountryRemove(item)}
                                                  className={styles.closeBtn}
                                              >
                                                  X
                                              </span>
                                          </li>
                                      ))
                                    : allowedCountries.map((item) => (
                                          <li key={item}>
                                              <span>{countryNameMapping[item]}</span>
                                              <span
                                                  onClick={() => handleCountryRemove(item)}
                                                  className={styles.closeBtn}
                                              >
                                                  X
                                              </span>
                                          </li>
                                      ))}
                            </ul>
                            <div style={{ display: "flex" }}>
                                <Button
                                    onClick={handleSaveGeoBlocking}
                                    title="Save & Close"
                                    color="lt-blue"
                                    style={customStyles.saveThresholdsBtn}
                                    loading={!activeDomain || activeDomain.isUpdating}
                                />
                                {geoStateSaveClicked && saved && (
                                    <SuccessBox
                                        override={true}
                                        style={{ ...customStyles.saved, alignSelf: "flex-start" }}
                                        message="✓ Saved successfully"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <h3>VPN Blocking</h3>
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    When this is enabled, Fraud Blocker will block any IP addresses that originate from a VPN (Virtual
                    Private Network) to click your ads. VPNs are often used to hide illicit activity.{" "}
                    <span className={styles.recommended}>Recommendation: Enabled</span>.
                </p>
                <Switch onChange={() => onSwitchChange("vpnBlocking")} name="vpnBlocking" checked={vpnBlocking} />
            </div>
            <h3>Accidental Clicks</h3>
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    When this is enabled, Fraud Blocker will block users that click your ad and then leave your site in
                    less than 2 seconds, often before your website even fully loads.{" "}
                    <span className={styles.recommended}>Recommendation: Enabled</span>.
                </p>
                <Switch
                    onChange={() => onSwitchChange("blockAccidental")}
                    name="blockAccidental"
                    checked={blockAccidental}
                />
            </div>
            <h3
                onClick={() =>
                    setState((prev) => ({
                        ...prev,
                        isThresholdOpen: !prev.isThresholdOpen,
                    }))
                }
                style={{ cursor: "pointer" }}
                className={styles.subTitle}
            >
                Click Fraud Thresholds
            </h3>
            <p
                style={{ cursor: "pointer" }}
                onClick={() =>
                    setState((prev) => ({
                        ...prev,
                        isThresholdOpen: !prev.isThresholdOpen,
                    }))
                }
                className={styles.fraudThresholdDesc}
            >
                Our system helps detect fraud based on a user’s click frequency (among other detection techniques).
                However, if you’d like to override our system and add your own rules, you may do that here.
                <img
                    className={`${styles.expandIcon} ${!isThresholdOpen && styles.expandIconClosed}`}
                    src={ArrowRight}
                />
            </p>
            <div className={`${styles.thresholdWrapperHidden} ${isThresholdOpen ? styles.active : ""}`}>
                <div className={styles.thresholdWrapper}>
                    {Object.entries(clickFraudThresholds).map(([key, threshold], index) => (
                        <div
                            key={index}
                            className={`${styles.thresholdContainer} ${removeThresholdClass === key ? styles.removeThreshold : ""}`}
                        >
                            <p>Allow up to</p>
                            <Input
                                index={index}
                                style={customStyles.input}
                                value={threshold}
                                name="clicks"
                                onChange={({ target: { value } }) =>
                                    onInputChange(value ? parseInt(value, 10) : value, key)
                                }
                            />
                            <p className={styles.adsClickWithin}>ad clicks within</p>
                            <Dropdown
                                options={dropdownOptions}
                                index={key}
                                value={dropdownOptions.find((item) => item.value === key)}
                                name="duration"
                                onOptionChange={(selected) => onOptionChange(selected, key)}
                                placeholder="Select"
                                style={customStyles.dropdown}
                            />
                            <p className={styles.deleteAction}>
                                <DeleteIcon
                                    index={index}
                                    style={customStyles.deleteBtn}
                                    onClick={() => onRemoveThreshold(key)}
                                />
                            </p>
                        </div>
                    ))}
                </div>
                <div className={styles.thresholdBtnContainer}>
                    <Button
                        onClick={onAddThresholdClick}
                        style={customStyles.addThresholdBtn}
                        color="outline"
                        title="+ Add Threshold"
                        disabled={isMaxThresholdAdded}
                    />
                    <Button
                        onClick={onSaveThresholds}
                        style={customStyles.saveThresholdsBtn}
                        color="lt-blue-auto"
                        title="Save"
                        disabled={isSaveDisabled()}
                        loading={!activeDomain || activeDomain.isUpdating}
                    />
                    {saved && isSaveClicked && (
                        <SuccessBox
                            override={true}
                            style={{ ...customStyles.saved, alignSelf: "flex-start" }}
                            message="✓ Saved successfully"
                        />
                    )}
                </div>
            </div>
            <div className={styles.sectionGap} />
            <h2 className={styles.sectionHead}>
                <img alt="target" src={OrbitIcon} />
                LARGE ADJUSTMENTS
            </h2>
            <h3>Aggressive Blocking</h3>
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    By enabling this feature, Fraud Blocker will reduce its scoring threshold to block additional IP
                    sources that are suspected to be fraud (but not confirmed fraud). Be aware, this may significantly
                    reduce your overall ad traffic.
                </p>
                <Switch
                    onChange={() => onSwitchChange("aggressiveBlocking")}
                    name="aggressiveBlocking"
                    checked={aggressiveBlocking}
                />
            </div>
            <h3>Abusive IPs</h3>
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    When this is enabled, Fraud Blocker will import blacklisted addresses to your Google Ads account
                    that are reported globally to be abusive and contain fraudulent. These are reported on sites such as
                    firehol. Learn more{" "}
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://help.fraudblocker.com/en/articles/6355256-why-are-there-500-ips-blocked-in-my-google-ads-account"
                    >
                        here
                    </a>
                    . <span className={styles.recommended}>Recommendation: Enabled</span>.
                </p>
                <Switch onChange={() => onSwitchChange("abusiveIPs")} name="abusiveIPs" checked={abusiveIPs} />
            </div>
            <h3>Monitoring Only Mode</h3>
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    When this is enabled, Fraud Blocker will only monitor your click activity. It will no longer block
                    any IP addresses and it will remove any IPs in your existing Google Ads IP exclusion list.{" "}
                    <span className={styles.recommended}>Recommendation: Disabled</span>.
                </p>
                <Switch
                    disabled={!accounts.subscriptionValid}
                    onChange={() => onSwitchChange("monitorOnlyMode")}
                    name="monitorOnlyMode"
                    checked={monitorOnlyMode}
                />
            </div>
        </div>
    );
};

DetectionRules.propTypes = {
    activeDomain: PropTypes.object,
    updateDomain: PropTypes.func,
    accounts: PropTypes.object,
};

const mapStateToProps = (state) => ({
    activeDomain: state.activeDomain,
    accounts: state.accounts,
});

const mapDispatchToProps = (dispatch) => ({
    updateDomain: (id, payload, noLoader) => dispatch(ActiveDomain.updateDomain(id, payload, noLoader)),
});

export default connect(mapStateToProps, mapDispatchToProps)(DetectionRules);
