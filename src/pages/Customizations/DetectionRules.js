import React, { useState, useEffect } from "react";
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
    {
        value: "5m",
        label: "5 minutes",
    },
    {
        value: "1h",
        label: "1 hour",
    },
    {
        value: "24h",
        label: "1 day",
    },
];

const countryOptions = Object.entries(countryNameMapping)
    .map(([key, val]) => ({
        label: val,
        value: key,
        icon: `/flags/${key.toLowerCase()}.svg`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

function DetectionRules(props) {
    const [clickFraudThresholds, setClickFraudThresholds] = useState({
        "5m": "",
    });
    const [detectIPs, setDetectIPs] = useState(true);
    const [vpnBlocking, setVpnBlocking] = useState(true);
    const [monitorOnlyMode, setMonitorOnlyMode] = useState(false);
    const [aggressiveBlocking, setAggressiveBlocking] = useState(false);
    const [blockAccidental, setBlockAccidental] = useState(true);
    const [abusiveIPs, setAbusiveIPs] = useState(true);
    const [saved, setSaved] = useState(false);
    const [removeThresholdClass, setRemoveThresholdClass] = useState("");
    const [isSaveClicked, setIsSaveClicked] = useState(false);
    const [isThresholdOpen, setIsThresholdOpen] = useState(false);
    const [isGeoBlockingOpen, setIsGeoBlockingOpen] = useState(false);
    const [geoToggleState, setGeoToggleState] = useState("allowed");
    const [geoStateSaveClicked, setGeoStateSaveClicked] = useState(false);
    const [allowedCountries, setAllowedCountries] = useState([]);
    const [blockedCountries, setBlockedCountries] = useState([]);

    const setStateData = () => {
        const {
            activeDomain: {
                data: {
                    click_fraud_thresholds: clickFraudThresholdsData,
                    detect_ips: detectIPsData,
                    vpn_blocking: vpnBlockingData,
                    monitoring_only: monitorOnlyModeData,
                    aggressive_blocking: aggressiveBlockingData,
                    block_accidental: blockAccidentalData,
                    abusive_ips: abusiveIPsData,
                    allowed_countries: allowedCountriesData,
                    blocked_countries: blockedCountriesData,
                },
            },
        } = props;

        setClickFraudThresholds(
            !clickFraudThresholdsData ||
                Array.isArray(clickFraudThresholdsData) ||
                (!Array.isArray(clickFraudThresholdsData) &&
                    typeof clickFraudThresholdsData === "object" &&
                    !Object.keys(clickFraudThresholdsData).length)
                ? {
                      "5m": "",
                  }
                : clickFraudThresholdsData
        );
        setDetectIPs(typeof detectIPsData === "undefined" ? true : detectIPsData);
        setVpnBlocking(typeof vpnBlockingData === "undefined" ? true : vpnBlockingData);
        setBlockAccidental(typeof blockAccidentalData === "undefined" ? true : blockAccidentalData);
        setAbusiveIPs(typeof abusiveIPsData === "undefined" || abusiveIPsData === null ? true : abusiveIPsData);
        setAllowedCountries(allowedCountriesData ? allowedCountriesData.split("_") : []);
        setBlockedCountries(blockedCountriesData ? blockedCountriesData.split("_") : []);
        setMonitorOnlyMode(monitorOnlyModeData);
        setAggressiveBlocking(aggressiveBlockingData);
        setSaved(false);
        setRemoveThresholdClass("");
        setIsSaveClicked(false);
        setGeoStateSaveClicked(false);
        setGeoToggleState(blockedCountriesData ? "blocked" : "allowed");
    };

    useEffect(() => {
        if (props.activeDomain && props.activeDomain.data) {
            setStateData();
        }
    }, [props.activeDomain]);

    useEffect(() => {
        if (
            props.activeDomain &&
            props.activeDomain.isUpdating &&
            !props.activeDomain.error &&
            !saved // Check that 'saved' is false
        ) {
            setSaved(true); // Set it to true when the update is successful
        }
    }, [props.activeDomain, saved]);

    const onInputChange = (value, key) => {
        const newClickThresholds = {
            ...clickFraudThresholds,
        };
        newClickThresholds[key] = value;
        setClickFraudThresholds(newClickThresholds);
    };

    const onOptionChange = (selected, key) => {
        if (clickFraudThresholds[selected.value]) {
            return;
        }
        const newClickThresholds = {
            ...clickFraudThresholds,
        };
        delete newClickThresholds[key];
        newClickThresholds[selected.value] = "";
        setClickFraudThresholds(newClickThresholds);
    };
    const onSwitchChange = (name) => {
        if (!props.accounts.subscriptionValid) {
            return;
        }
        //Use functional updates to get previous state.
        setSaved(false);
        setIsSaveClicked(false);

        switch (name) {
            case "vpnBlocking":
                setVpnBlocking((prev) => !prev);
                break;
            case "monitorOnlyMode":
                setMonitorOnlyMode((prev) => !prev);
                break;
            case "aggressiveBlocking":
                setAggressiveBlocking((prev) => !prev);
                break;
            case "blockAccidental":
                setBlockAccidental((prev) => !prev);
                break;
            case "abusiveIPs":
                setAbusiveIPs((prev) => !prev);
                break;
            default:
                break;
        }

        if (props.activeDomain.data.id) {
            props.updateDomain(
                props.activeDomain.data.id,
                {
                    id: props.activeDomain.data.id,
                    detect_ips: name === "detectIPs" ? !detectIPs : detectIPs,
                    vpn_blocking: name === "vpnBlocking" ? !vpnBlocking : vpnBlocking,
                    monitoring_only: name === "monitorOnlyMode" ? !monitorOnlyMode : monitorOnlyMode,
                    aggressive_blocking: name === "aggressiveBlocking" ? !aggressiveBlocking : aggressiveBlocking,
                    block_accidental: name === "blockAccidental" ? !blockAccidental : blockAccidental,
                    abusive_ips: name === "abusiveIPs" ? !abusiveIPs : abusiveIPs,
                },
                true
            );
        }
    };

    const onAddThresholdClick = () => {
        const newClickThresholds = {
            ...clickFraudThresholds,
        };
        if (newClickThresholds["5m"] === undefined) {
            newClickThresholds["5m"] = "";
        } else if (newClickThresholds["1h"] === undefined) {
            newClickThresholds["1h"] = "";
        } else if (newClickThresholds["24h"] === undefined) {
            newClickThresholds["24h"] = "";
        }
        setClickFraudThresholds(newClickThresholds);
    };

    const onRemoveThreshold = (key) => {
        setRemoveThresholdClass(key);
        setTimeout(() => {
            const newClickThresholds = {
                ...clickFraudThresholds,
            };
            delete newClickThresholds[key];
            setClickFraudThresholds(newClickThresholds);
            setRemoveThresholdClass("");
        }, 200);
    };

    const isSaveDisabled = () => {
        return Object.values(clickFraudThresholds).some((value) => !value);
    };

    const onSaveThresholds = () => {
        if (isSaveDisabled()) {
            return;
        }
        setSaved(false);
        setIsSaveClicked(true);
        if (props.activeDomain.data.id) {
            props.updateDomain(props.activeDomain.data.id, {
                id: props.activeDomain.data.id,
                click_fraud_thresholds: clickFraudThresholds,
            });
        }
    };

    const handleSaveGeoBlocking = () => {
        setGeoStateSaveClicked(true);
        setSaved(false);
        if (props.activeDomain.data.id) {
            props.updateDomain(props.activeDomain.data.id, {
                id: props.activeDomain.data.id,
                allowed_countries: allowedCountries.length ? allowedCountries.join("_") : null,
                blocked_countries: blockedCountries.length ? blockedCountries.join("_") : null,
            });
        }
    };

    const onGeoStateToggleChange = (event) => {
        setGeoToggleState(event.target.value);
    };

    const handleCountrySelect = (selected) => {
        if (geoToggleState === "allowed") {
            setAllowedCountries((prevCountries) =>
                prevCountries.includes(selected.value) ? prevCountries : [...prevCountries, selected.value]
            );
        }
        if (geoToggleState === "blocked") {
            setBlockedCountries((prevCountries) =>
                prevCountries.includes(selected.value) ? prevCountries : [...prevCountries, selected.value]
            );
        }
    };

    const handleCountryRemove = (country) => {
        if (geoToggleState === "allowed") {
            setAllowedCountries((prevCountries) => prevCountries.filter((item) => item !== country));
        }
        if (geoToggleState === "blocked") {
            setBlockedCountries((prevCountries) => prevCountries.filter((item) => item !== country));
        }
    };

    const isMaxThresholdAdded = clickFraudThresholds["5m"] && clickFraudThresholds["1h"] && clickFraudThresholds["24h"];

    return (
        <div className={styles.content}>
            <h1 className={styles.title}> Manage Detection Rules </h1>{" "}
            <h2 className={styles.sectionHead}>
                <img alt="target" src={TargetIcon} />
                TARGETED ADJUSTMENTS{" "}
            </h2>{" "}
            <h3
                style={{
                    cursor: "pointer",
                }}
                onClick={() => setIsGeoBlockingOpen((prevState) => !prevState)}
            >
                Geo - Blocking By Country{" "}
            </h3>{" "}
            <p
                style={{
                    cursor: "pointer",
                }}
                onClick={() => setIsGeoBlockingOpen((prevState) => !prevState)}
                className={`${styles.fraudThresholdDesc} ${styles.switchOptionContainer}`}
            >
                This feature allows you to determine which countries you would like to allow or block from your ad
                campaigns.{" "}
                <img
                    className={`${styles.expandIcon} ${!isGeoBlockingOpen && styles.expandIconClosed}`}
                    src={ArrowRight}
                />{" "}
            </p>{" "}
            <div
                className={`${styles.thresholdWrapperHidden} ${styles.extraGutter} ${
                    isGeoBlockingOpen ? styles.active : ""
                }`}
            >
                <div className={`${styles.switchOptionContainer} ${styles.geoBlocking}`}>
                    <div
                        style={{
                            width: "100%",
                        }}
                    >
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
                                    />{" "}
                                </div>{" "}
                                <strong> Block </strong> all ad clicks coming from the countries listed below, or{" "}
                            </div>{" "}
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
                                    />{" "}
                                </div>{" "}
                                <strong> Allow </strong> ad clicks coming from the countries listed below and block all
                                others{" "}
                            </div>{" "}
                        </div>{" "}
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
                            </div>{" "}
                            <ul className={styles.selectedCountryList}>
                                {" "}
                                {geoToggleState === "blocked"
                                    ? blockedCountries.map((item) => (
                                          <li key={item}>
                                              <span> {countryNameMapping[item]} </span>{" "}
                                              <span
                                                  onClick={() => handleCountryRemove(item)}
                                                  className={styles.closeBtn}
                                              >
                                                  X{" "}
                                              </span>{" "}
                                          </li>
                                      ))
                                    : allowedCountries.map((item) => (
                                          <li key={item}>
                                              <span> {countryNameMapping[item]} </span>{" "}
                                              <span
                                                  onClick={() => handleCountryRemove(item)}
                                                  className={styles.closeBtn}
                                              >
                                                  X{" "}
                                              </span>{" "}
                                          </li>
                                      ))}{" "}
                            </ul>{" "}
                            <div
                                style={{
                                    display: "flex",
                                }}
                            >
                                <Button
                                    onClick={handleSaveGeoBlocking}
                                    title="Save & Close"
                                    color="lt-blue"
                                    style={customStyles.saveThresholdsBtn}
                                    loading={!props.activeDomain || props.activeDomain.isUpdating}
                                />{" "}
                                {geoStateSaveClicked && saved && (
                                    <SuccessBox
                                        override={true}
                                        style={customStyles.saved}
                                        message="✓ Saved successfully"
                                    />
                                )}{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>{" "}
                </div>{" "}
            </div>{" "}
            <h3> VPN Blocking </h3>{" "}
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    When this is enabled, Fraud Blocker will block any IP addresses that originate from a VPN(Virtual
                    Private Network) to click your ads.VPNs are often used to hide illicit activity.{" "}
                    <span className={styles.recommended}> Recommendation: Enabled </span>.{" "}
                </p>{" "}
                <Switch onChange={onSwitchChange} name="vpnBlocking" checked={vpnBlocking} />{" "}
            </div>{" "}
            <h3> Accidental Clicks </h3>{" "}
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    When this is enabled, Fraud Blocker will block users that click your ad and then leave your site in
                    less than 2 seconds, often before your website even fully loads.{" "}
                    <span className={styles.recommended}> Recommendation: Enabled </span>.{" "}
                </p>{" "}
                <Switch onChange={onSwitchChange} name="blockAccidental" checked={blockAccidental} />{" "}
            </div>{" "}
            <h3
                onClick={() => setIsThresholdOpen((prevState) => !prevState)}
                style={{
                    cursor: "pointer",
                }}
                className={styles.subTitle}
            >
                Click Fraud Thresholds{" "}
            </h3>{" "}
            <p
                style={{
                    cursor: "pointer",
                }}
                onClick={() => setIsThresholdOpen((prevState) => !prevState)}
                className={styles.fraudThresholdDesc}
            >
                Our system helps detect fraud based on a user’ s click frequency(among other detection
                techniques).However, if you’ d like to override our system and add your own rules, you may do that here.{" "}
                <img
                    className={`${styles.expandIcon} ${!isThresholdOpen && styles.expandIconClosed}`}
                    src={ArrowRight}
                />{" "}
            </p>{" "}
            <div className={`${styles.thresholdWrapperHidden} ${isThresholdOpen ? styles.active : ""}`}>
                <div className={styles.thresholdWrapper}>
                    {" "}
                    {Object.entries(clickFraudThresholds).map(([key, threshold], index) => {
                        return (
                            <div
                                key={index}
                                className={`${styles.thresholdContainer} ${
                                    removeThresholdClass === key ? styles.removeThreshold : ""
                                }`}
                            >
                                <p> Allow up to </p>{" "}
                                <Input
                                    index={index}
                                    style={customStyles.input}
                                    value={threshold}
                                    name="clicks"
                                    onChange={({ target: { value } }) =>
                                        onInputChange(value ? parseInt(value, 10) : value, key)
                                    }
                                />{" "}
                                <p className={styles.adsClickWithin}> ad clicks within </p>{" "}
                                <Dropdown
                                    options={dropdownOptions}
                                    index={key}
                                    value={dropdownOptions.find((item) => item.value === key)}
                                    name="duration"
                                    onOptionChange={onOptionChange}
                                    placeholder="Select"
                                    style={customStyles.dropdown}
                                />{" "}
                                <p className={styles.deleteAction}>
                                    <DeleteIcon
                                        index={index}
                                        style={customStyles.deleteBtn}
                                        onClick={() => onRemoveThreshold(key)}
                                    />{" "}
                                </p>{" "}
                            </div>
                        );
                    })}{" "}
                </div>{" "}
                <div className={styles.thresholdBtnContainer}>
                    <Button
                        onClick={onAddThresholdClick}
                        style={customStyles.addThresholdBtn}
                        color="outline"
                        title="+ Add Threshold"
                        disabled={isMaxThresholdAdded}
                    />{" "}
                    <Button
                        onClick={onSaveThresholds}
                        style={customStyles.saveThresholdsBtn}
                        color="lt-blue-auto"
                        title="Save"
                        disabled={isSaveDisabled()}
                        loading={!props.activeDomain || props.activeDomain.isUpdating}
                    />{" "}
                    {saved && isSaveClicked && (
                        <SuccessBox
                            override={true}
                            style={{
                                ...customStyles.saved,
                                alignSelf: "flex-start",
                            }}
                            message="✓ Saved successfully"
                        />
                    )}{" "}
                </div>{" "}
            </div>{" "}
            <div className={styles.sectionGap}> </div>{" "}
            <h2 className={styles.sectionHead}>
                <img alt="target" src={OrbitIcon} />
                LARGE ADJUSTMENTS{" "}
            </h2>{" "}
            <h3> Aggressive Blocking </h3>{" "}
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    By enabling this feature, Fraud Blocker will reduce its scoring threshold to block additional IP
                    sources that are supsected to be fraud(but not confirmed fraud).Be aware, this may significantly
                    reduce your overall ad traffic.{" "}
                </p>{" "}
                <Switch onChange={onSwitchChange} name="aggressiveBlocking" checked={aggressiveBlocking} />{" "}
            </div>{" "}
            <h3> Abusive IPs </h3>{" "}
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    When this is enabled, Fraud Blocker will import blacklisted addresses to your Google Ads account
                    that are reported globally to be abusive and contain fraudulent.These are reported on sites such as
                    firehol.Learn more{" "}
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://help.fraudblocker.com/en/articles/6355256-why-are-there-500-ips-blocked-in-my-google-ads-account"
                    >
                        here{" "}
                    </a>
                    . <span className={styles.recommended}> Recommendation: Enabled </span>.{" "}
                </p>{" "}
                <Switch onChange={onSwitchChange} name="abusiveIPs" checked={abusiveIPs} />{" "}
            </div>{" "}
            <h3> Monitoring Only Mode </h3>{" "}
            <div className={styles.switchOptionContainer}>
                <p className={styles.switchLabel}>
                    When this is enabled, Fraud Blocker will only monitor your click activity.It will no longer block
                    any IP addresses and it will remove any IPs in your existing Google Ads IP exclusion list.{" "}
                    <span className={styles.recommended}> Recommendation: Disabled </span>.{" "}
                </p>{" "}
                <Switch
                    disabled={!props.accounts.subscriptionValid}
                    onChange={onSwitchChange}
                    name="monitorOnlyMode"
                    checked={monitorOnlyMode}
                />{" "}
            </div>{" "}
        </div>
    );
}

DetectionRules.propTypes = {
    activeDomain: PropTypes.object,
    updateDomain: PropTypes.func,
    accounts: PropTypes.object,
};

const mapStateToProps = (state) => ({
    activeDomain: state.activeDomain,
    accounts: state.accounts,
});

const mapDispatchToProps = (dispatch) => {
    return {
        updateDomain: (id, payload, noLoader) => dispatch(ActiveDomain.updateDomain(id, payload, noLoader)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(DetectionRules);
