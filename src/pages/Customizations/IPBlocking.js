import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import styles from "./Customizations.module.scss";
import Button from "../../components/Button/Button";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import SuccessBox from "../../components/SuccessBox/SuccessBox";
import IPBlockList from "../../redux/actions/IpBlockList";
import Validation from "../../utils/Validation";
import GoogleAds from "../../api/GoogleAds";

const customStyles = {
    saveBtn: {
        maxWidth: 110,
        marginBottom: 60,
    },
};

const IPBlocking = () => {
    const [state, setState] = useState({
        originalIpBlocks: [],
        ipBlacklist: "",
        originalWhiteIps: [],
        whiteIpslist: "",
        ipWhitelist: "",
        errors: {},
        saveSuccess: {},
        loading: {},
    });

    const accounts = useSelector((state) => state.accounts);
    const ipBlocklist = useSelector((state) => state.ipBlocklist.data);
    const ipWhitelist = useSelector((state) => state.ipBlocklist.whiteIPs);
    const activeDomain = useSelector((state) => state.activeDomain);
    const dispatch = useDispatch();

    // Thay componentDidMount
    useEffect(() => {
        if (activeDomain.data && activeDomain.data.id) {
            fetchBlockedIPs();
        }
    }, [activeDomain.data?.id]); // Dependency array dựa trên activeDomain.data.id

    // Thay componentDidUpdate
    useEffect(() => {
        if (activeDomain && activeDomain.data && activeDomain.data.id && (!ipBlocklist.length || !ipWhitelist.length)) {
            fetchBlockedIPs();
        }
        if (
            activeDomain &&
            activeDomain.data &&
            activeDomain.data.id &&
            activeDomain.data.id !== state.originalIpBlocks[0]?.domain_id
        ) {
            setState({
                originalIpBlocks: [],
                ipBlacklist: "",
                originalWhiteIps: [],
                whiteIpslist: "",
                ipWhitelist: "",
                errors: {},
                saveSuccess: {},
                loading: {},
            });
            fetchBlockedIPs();
        }
    }, [activeDomain.data?.id, ipBlocklist.length, ipWhitelist.length]); // Dependency array dựa trên activeDomain.data.id và length của blocklist/whitelist

    const fetchBlockedIPs = useCallback(async () => {
        try {
            const result = await dispatch(IPBlockList.fetchLatestBlocklist(activeDomain.data.id));
            if (result) {
                const ipBlocks = result.filter((ip) => ip.is_blocked === true).map((ipBlock) => ipBlock.address);
                const ipsWhite = result.filter((ip) => ip.is_blocked === false).map((ipBlock) => ipBlock.address);
                setState((prev) => ({
                    ...prev,
                    ipBlacklist: ipBlocks.join("\n"),
                    originalIpBlocks: ipBlocks,
                    whiteIpslist: ipsWhite.join("\n"),
                    originalWhiteIps: ipsWhite,
                }));
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }, [activeDomain.data?.id, dispatch]);

    const onInputChange = useCallback((event) => {
        const { name, value } = event.target;
        setState((prev) => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const onSaveIPBlacklist = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            errors: {},
            loading: { ...prev.loading, blocklist: true },
        }));
        const { ipBlacklist, originalIpBlocks } = state;

        const hasErrors = [];
        const ipBlacklistCombined = ipBlacklist ? ipBlacklist.split("\n").filter((item) => item.trim() !== "") : [];
        ipBlacklistCombined.forEach((ipBlock) => {
            const isValid = Validation.validIpAddress(ipBlock.trim());
            if (!isValid) {
                hasErrors.push(ipBlock);
            }
        });

        if (hasErrors.length > 0) {
            setState((prev) => ({
                ...prev,
                loading: { ...prev.loading, blocklist: false },
                errors: {
                    blockError: `Invalid IP Address or Incorrect Format: [${hasErrors.join("\n")}]`,
                },
            }));
            return;
        }

        const additional = ipBlacklistCombined.filter((ipAddress) => {
            return !originalIpBlocks.some((ogIpAddress) => {
                return ipAddress.trim() === ogIpAddress;
            });
        });

        const removals = originalIpBlocks.filter((ogIpAddress) => {
            return !ipBlacklistCombined.some((ipAddress) => {
                return ipAddress.trim() === ogIpAddress;
            });
        });

        const removalIpBlocks = [];
        removals.forEach((ip) => {
            const ipWhite = ipBlocklist.find((item) => item.address === ip.trim());
            if (ipWhite) {
                removalIpBlocks.push(ipWhite.id);
            }
        });

        if (originalIpBlocks.length !== ipBlacklistCombined.length) {
            for (let i = 0; i < originalIpBlocks.length; i += 1) {
                const originalItemsLength = originalIpBlocks.filter((ip) => ip === originalIpBlocks[i]).length;
                const newItemsLength = ipBlacklistCombined.filter((ip) => ip === ipBlacklistCombined[i]).length;
                if (
                    newItemsLength &&
                    originalItemsLength > newItemsLength &&
                    removals.filter((item) => item === originalIpBlocks[i]).length <
                        originalItemsLength - newItemsLength
                ) {
                    removals.push(originalIpBlocks[i]);
                    removalIpBlocks.push(ipBlocklist[i].id);
                }
            }
        }

        const addIpBlocks = [...new Set(additional)].map((addIp) => ({
            account_id: accounts.data.id,
            address: addIp.trim(),
            domain_id: activeDomain.data.id,
            is_blocked: true,
        }));

        const removalIpWhite = [];
        additional.forEach((ip) => {
            const ipWhite = ipWhitelist.find((item) => item.address === ip.trim());
            if (ipWhite) {
                removalIpWhite.push(ipWhite.id);
            }
        });

        try {
            if (removalIpWhite.length > 0) {
                await GoogleAds.removeIpFromBlocklist({ ids: removalIpWhite });
            }
            if (addIpBlocks.length > 0) {
                await GoogleAds.addIpToBlocklist({ ips: addIpBlocks });
            }
            if (removals.length > 0) {
                await GoogleAds.removeIpFromBlocklist({ ids: removalIpBlocks });
            }
            await fetchBlockedIPs();
            setState((prev) => ({
                ...prev,
                saveSuccess: { ...prev.saveSuccess, blocklist: true },
                loading: { ...prev.loading, blocklist: false },
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                saveSuccess: {},
                errors: { ...prev.errors, blockError: error.message },
                loading: { ...prev.loading, blocklist: false },
            }));
        }
    }, [state.ipBlacklist, state.originalIpBlocks, accounts, ipBlocklist, ipWhitelist, activeDomain, fetchBlockedIPs]);

    const onSaveIPWhitelist = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            errors: { ...prev.errors, whiteError: "" },
            loading: { ...prev.loading, whitelist: true },
        }));
        const { whiteIpslist, originalWhiteIps } = state;

        const hasErrors = [];
        const combined = whiteIpslist ? whiteIpslist.split("\n").filter((item) => item.trim() !== "") : [];
        combined.forEach((ip) => {
            const isValid = Validation.validIpAddress(ip.trim());
            if (!isValid) {
                hasErrors.push(ip);
            }
        });

        if (hasErrors.length > 0) {
            setState((prev) => ({
                ...prev,
                loading: { ...prev.loading, whitelist: false },
                errors: {
                    ...prev.errors,
                    whiteError: `Invalid IP Address or Incorrect Format: [${hasErrors.join("\n")}]`,
                },
            }));
            return;
        }

        const additional = combined.filter((ipAddress) => {
            return !originalWhiteIps.some((ogIpAddress) => {
                return ipAddress.trim() === ogIpAddress;
            });
        });

        const removals = originalWhiteIps.filter((ogIpAddress) => {
            return !combined.some((ipAddress) => {
                return ipAddress.trim() === ogIpAddress;
            });
        });

        const removalIps = [];
        removals.forEach((ip) => {
            const ipWhite = ipWhitelist.find((item) => item.address === ip.trim());
            if (ipWhite) {
                removalIps.push(ipWhite.id);
            }
        });

        if (originalWhiteIps.length !== combined.length) {
            for (let i = 0; i < originalWhiteIps.length; i += 1) {
                const originalItemLength = originalWhiteIps.filter((ip) => ip === originalWhiteIps[i]).length;
                const newItemLength = combined.filter((ip) => ip === combined[i]).length;
                if (
                    newItemLength &&
                    originalItemLength > newItemLength &&
                    removals.filter((item) => item === originalWhiteIps[i]).length < originalItemLength - newItemLength
                ) {
                    removals.push(originalWhiteIps[i]);
                    removalIps.push(ipWhitelist[i].id);
                }
            }
        }

        const removalWhite = [];
        additional.forEach((ip) => {
            const ipWhite = ipBlocklist.find((item) => item.address === ip.trim());
            if (ipWhite) {
                removalWhite.push(ipWhite.id);
            }
        });

        const addIps = [...new Set(additional)].map((addIp) => ({
            account_id: accounts.data.id,
            address: addIp.trim(),
            domain_id: activeDomain.data.id,
            is_blocked: false,
        }));

        try {
            if (removalWhite.length > 0) {
                await GoogleAds.removeIpFromBlocklist({ ids: removalWhite });
            }
            if (addIps.length > 0) {
                await GoogleAds.addIpToBlocklist({ ips: addIps });
            }
            if (removals.length > 0) {
                await GoogleAds.removeIpFromBlocklist({ ids: removalIps });
            }
            await fetchBlockedIPs();
            setState((prev) => ({
                ...prev,
                saveSuccess: { ...prev.saveSuccess, whitelist: true },
                loading: { ...prev.loading, whitelist: false },
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                saveSuccess: {},
                errors: { ...prev.errors, whiteError: error.message },
                loading: { ...prev.loading, whitelist: false },
            }));
        }
    }, [state.whiteIpslist, state.originalWhiteIps, accounts, ipBlocklist, ipWhitelist, activeDomain, fetchBlockedIPs]);

    const { whiteIpslist, ipBlacklist, errors, saveSuccess, loading } = state;

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Manage IP Blocking</h1>
            <h3 className={styles.subTitle}>IP Blacklist</h3>
            <p>
                Add IPs in the box below that you want Fraud Blocker to always block (such as internal staff IPs). Each
                IP address must be in a new line and you can designate a range of IPs by adding a wildcard character (*)
                or CIDR notation (example: 218.100.46.0/23 and 196.10.252.*).
            </p>
            <textarea className={styles.textarea} value={ipBlacklist} name="ipBlacklist" onChange={onInputChange} />
            {saveSuccess.blocklist && <SuccessBox message="Save Successful" />}
            {errors.blockError && <ErrorBox error={errors.blockError} />}
            <Button title="Save" loading={loading.blocklist} onClick={onSaveIPBlacklist} style={customStyles.saveBtn} />
            <h3 className={styles.subTitle}>IP Whitelist</h3>
            <p>
                Add IPs in the box below that you want Fraud Blocker never to block. Each IP address must be in a new
                line and you can designate a range of IPs by adding a wildcard character (*) or CIDR notation (example:
                218.100.46.0/23 and 196.10.252.*).
            </p>
            <textarea className={styles.textarea} value={whiteIpslist} name="whiteIpslist" onChange={onInputChange} />
            {saveSuccess.whitelist && <SuccessBox message="Save Successful" />}
            {errors.whiteError && <ErrorBox error={errors.whiteError} />}
            <Button
                title="Save"
                color="blue"
                onClick={onSaveIPWhitelist}
                style={customStyles.saveBtn}
                loading={loading.whitelist}
            />
        </div>
    );
};

IPBlocking.propTypes = {
    accounts: PropTypes.object,
    activeDomain: PropTypes.object,
    ipBlocklist: PropTypes.array,
    ipWhitelist: PropTypes.array,
    fetchLatestBlocklist: PropTypes.func,
};

export default IPBlocking;
