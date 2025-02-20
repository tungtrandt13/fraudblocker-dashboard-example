import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import DomainsApi from '../../api/Domains';
import DataApi from '../../api/Data';
import styles from './Integrations.module.scss';
import Button from '../../components/Button/Button';
import ErrorBox from '../../components/ErrorBox/ErrorBox';
import WarningIcon from '../../assets/warning.png';
import CopyIcon from '../../assets/copy-code.png';
import CheckInstallIcon from '../../assets/check-install.svg';
import SuccessBox from '../../components/SuccessBox/SuccessBox';

const customStyles = {
    copyCodeBtn: {
        width: 180,
        marginBottom: 50,
        height: '40px'
    },
    copyCode: {
        marginRight: '5px',
        marginBottom: '-3px'
    },
    runTestBtn: {
        width: 150,
        marginTop: 15,
        border: 'none',
        fontWeight: 'normal'
    },
    lastOption: {
        marginTop: 40
    },
    textarea: {
        color: '#6f6f6f'
    },
    pgap: {
        marginBottom: '10px'
    },
    copyWrap: {
        display: 'flex',
        alignItems: 'baseline'
    },
    copied: {
        maxWidth: '200px',
        marginLeft: '10px',
        fontWeight: '600',
        padding: '10px 15px'
    },
    failed: {
        width: '50%',
        marginTop: '20px'
    },
    installFailed: {
        width: '55%',
        marginTop: '0px',
        marginBottom: '0px'
    },
    installError: {
        color: 'inherit'
    },
    connectBtn: {
        textDecoration: 'none'
    },
    installSuccess: {
        maxWidth: '200px',
        fontWeight: '600',
        padding: '10px 15px'
    }
};

const FraudBlockerTracker = () => {
    const codeRef = useRef();
    const activeDomain = useSelector(state => state.activeDomain);
    
    const [state, setState] = useState({
        copiedSiteTracker: false,
        verified: false,
        verifying: false,
        unverified: false,
        checking: false,
        installSuccess: false,
        installFailed: false
    });

    const copySiteTracker = (index) => {
        if (index === 0) {
            console.log('Copy Site Tracker');
            const copyText = codeRef.current;
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value);
            setState(prev => ({
                ...prev,
                copiedSiteTracker: true
            }));
        } else {
            console.log('copy Adwords Tracker');
        }
    };

    const runTest = async () => {
        setState(prev => ({
            ...prev,
            verified: false,
            verifying: true,
            unverified: false
        }));

        try {
            const response = await DomainsApi.verifyTrackerTag(activeDomain.data);
            if (response.verified) {
                setState(prev => ({
                    ...prev,
                    verified: true,
                    verifying: false
                }));

                if (window.gtag) {
                    const script = document.createElement('script');
                    const inlineScript = document.createTextNode(
                        `gtag('event', 'conversion', {'send_to': 'AW-743398152/MjLqCI_-wa0DEIi2veIC'});`
                    );
                    script.appendChild(inlineScript);
                    document.body.appendChild(script);
                }
            } else {
                setState(prev => ({
                    ...prev,
                    unverified: true,
                    verifying: false
                }));
            }
        } catch (err) {
            console.log('Error occured in verification');
            setState(prev => ({
                ...prev,
                unverified: true,
                verifying: false
            }));
        }
    };

    const checkInstallation = async () => {
        setState(prev => ({
            ...prev,
            installSuccess: false,
            checking: true,
            installFailed: false
        }));

        try {
            const response = await DataApi.checkInstallation(activeDomain.data.id);
            if (response.is_present) {
                setState(prev => ({
                    ...prev,
                    installSuccess: true,
                    checking: false
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    installFailed: true,
                    checking: false
                }));
            }
        } catch (err) {
            console.log('Error occured in install check');
            setState(prev => ({
                ...prev,
                checking: false,
                installFailed: err.message
            }));
        }
    };

    const sid = activeDomain?.data?.id;
    const siteTracker = `<!-- Fraud Blocker Tracker -->
<script type="text/javascript">
  (function () {
    var s = document.createElement("script"), 
      h = document.head;
    s.async = 1;
    s.src = "https://monitor.fraudblocker.com/fbt.js?sid=${sid}";
    h.appendChild(s);
  })();
</script>
<noscript>
  <a href="https://fraudblocker.com" rel="nofollow">
    <img src="https://monitor.fraudblocker.com/fbt.gif?sid=${sid}" alt="Fraud Blocker" />
  </a>
</noscript>
<!-- End Fraud Blocker Tracker -->`;

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Fraud Tracker</h1>
            <p className={styles.titleParagraph}>
                In order for us to analyze and block click fraud on your site, you must first install our Tracker code.
            </p>
            
            <h3 className={styles.subTitle}>Install Site Tracker(Required)</h3>
            <p className={styles.installNotice}>
                <img src={WarningIcon} className={styles.warningIcon} />
                <b>You must add the code below to your website</b>, immediately after the opening
                <i>&lt;head&gt;</i> tag.
            </p>

            <textarea
                ref={codeRef}
                readOnly
                className={styles.textarea}
                style={customStyles.textarea}
                value={siteTracker}
            />

            <div style={customStyles.copyWrap}>
                <Button
                    title={
                        <span>
                            <img
                                alt="copy"
                                style={customStyles.copyCode}
                                src={CopyIcon}
                            />
                            Copy Tracker Code
                        </span>
                    }
                    index={0}
                    color="blue"
                    onClick={copySiteTracker}
                    style={customStyles.copyCodeBtn}
                />
                {state.copiedSiteTracker && (
                    <SuccessBox
                        override={true}
                        style={customStyles.copied}
                        message="Copied!"
                    />
                )}
            </div>

            <h3 className={styles.subTitle}>How to install</h3>
            <p style={customStyles.pgap}>
                Similar to most analytics tags, you need to paste the code after the opening &lt;head&gt; tag in the global header or footer of your website.If you' re unfamilar with this process,
                here are instructions
                for the most common website builders:
            </p>
            <ul className={styles.guidelines}>
                <li>
                    For WordPress sites: {''}
                    <a href="https://help.fraudblocker.com/en/articles/3110894-how-to-install-fraud-blocker-s-tracking-code-with-a-wordpress-site"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for WordPress
                    </a>
                </li>
                <li>
                    For Wix sites: {''}
                    <a href="https://help.fraudblocker.com/en/articles/6222893-how-to-install-fraud-blocker-s-tracking-code-on-a-wix-website"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for Wix
                    </a>
                </li>
                <li>
                    For Squarespace sites: {''}
                    <a href="https://help.fraudblocker.com/en/articles/6222894-how-to-install-fraud-blocker-s-tracking-code-on-a-squarespace-website"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for Squarespace
                    </a>
                </li>
                <li>
                    For Shopify sites: {''}
                    <a href="https://help.fraudblocker.com/en/articles/6355254-how-to-install-fraud-blocker-s-tracking-code-on-a-shopify-website"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for Shopify
                    </a>
                </li>
                <li>
                    For sites using Google Tag Manager: {''}
                    <a href="https://help.fraudblocker.com/en/articles/6222892-how-to-install-fraud-blocker-s-tracking-code-with-google-tag-manager"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blackLink}
                    >
                        See our step-by-step guide for Google Tag Manager
                    </a>
                </li>
            </ul>
            <p className={styles.otherSupport}>
                For other sites platforms, {''}
                <a href="https://help.fraudblocker.com/en/collections/1818202-help-and-answers"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    visit our help documents
                </a>{' '}
                or {' '}
                <a href="https://fraudblocker.com/contact-us"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    contact our Support Team
                </a>
            </p>

            <p className={styles.checkInstallation}>
                <strong>To make sure everything is ready, </strong>&nbsp;check that your code was installed
                correctly.
                <div className={styles.checkInstallBtn}>
                    <Button
                        title={
                            <span>
                                <img src={CheckInstallIcon} />
                                Check Installation
                            </span>
                        }
                        color="blue"
                        onClick={checkInstallation}
                        loading={state.checking}
                    />
                    {state.installFailed && (
                        <ErrorBox
                            errorStyle={customStyles.installFailed}
                            error={
                                <div>
                                    Fraud Tracker not detected.Try another method in our {''}
                                    <a
                                        href="https://help.fraudblocker.com/en/articles/9375660-how-to-check-that-the-fraud-tracker-tag-is-installed-correctly"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={customStyles.installError}
                                    >
                                        help docs
                                    </a>
                                </div>
                            }
                        />
                    )}
                    {state.installSuccess && (
                        <SuccessBox
                            override={true}
                            style={customStyles.installSuccess}
                            message="Installation successful! 🎉"
                        />
                    )}
                </div>
            </p>

            <h3 style={customStyles.lastOption} className={styles.subTitle}>
                Next Step
            </h3>
            <p>
                It can take up to 1 hour to verify your Site Tracker installation.Please connect your Google Ads account next.
            </p>
            {state.unverified && (
                <ErrorBox errorStyle={customStyles.failed} error="The Tracker code was not found" />
            )}
            <div style={customStyles.copyWrap}>
                <Link style={customStyles.connectBtn} to="/integrations/google-ads-setup">
                    <Button
                        title="Connect Google Ads"
                        color="outline"
                        onClick={() => {}}
                        style={customStyles.runTestBtn}
                        loading={state.verifying}
                    />
                </Link>
                {state.verified && (
                    <span style={customStyles.copied}>✓Fraud Tracker Installation Successful</span>
                )}
            </div>
        </div>
    );
};

FraudBlockerTracker.propTypes = {
    accounts: PropTypes.object,
    activeDomain: PropTypes.object
};

export default FraudBlockerTracker;