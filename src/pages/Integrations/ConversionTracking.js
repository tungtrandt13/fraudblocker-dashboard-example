import React, {
    PureComponent
} from 'react';
import {
    connect
} from 'react-redux';
import PropTypes from 'prop-types';
import styles from './Integrations.module.scss';
import Button from '../../components/Button/Button';
import CopyIcon from '../../assets/copy-code.png';
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
        fontWeight: '600',
        marginLeft: '10px',
        padding: '10px 15px'
    },
    failed: {
        width: '50%',
        marginTop: '20px'
    },
    connectBtn: {
        textDecoration: 'none'
    }
};

class ConversionTracking extends PureComponent {
    constructor(props) {
        super(props);
        this.codeRef = React.createRef();
        this.state = {
            copiedSiteTracker: false
        };
    }

    copySiteTracker = () => {
        const copyText = this.codeRef.current;
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        this.setState({ copiedSiteTracker: true });
    };

    componentDidUpdate(prevProps) {
        if (
            this.props.activeDomain?.data?.id !== prevProps.activeDomain?.data?.id
        ) {
            this.setState({ copiedSiteTracker: false });
        }
    }

    render() {
        const sid = this.props.activeDomain?.data?.id;
        const siteTracker = `<!-- Fraud Blocker Tracker -->
<script type="text/javascript">
    (function () {
        var s = document.createElement("script"),
        h = document.head;
        s.async = 1;
        s.src = "https://monitor.fraudblocker.com/ctrack.js?sid=${sid}";
        h.appendChild(s);
    })();
</script>
<noscript>
    <a href="https://fraudblocker.com" rel="nofollow">
        <img src="https://monitor.fraudblocker.com/ctrack.js?sid=${sid}" alt="Fraud Blocker" />
    </a>
</noscript>
<!-- End Fraud Blocker Tracker -->`;

        return (
            <div className={styles.content}>
                <h1 className={styles.title}>Conversion Tracking</h1>
                <p className={styles.titleParagraph}>
                    This allows us to track if a visitor converted to a sale or a lead on your website. 
                    If a visitor converts, then we will avoid blocking that visitor's IP address and device in the future. 
                    Once installed, conversion data will appear alongside your IP data in your "Reports" and "Fraud Score" pages.
                </p>

                <h3 className={styles.subTitle}>Install Conversion Tracker (Optional)</h3>
                <p>This is your custom Conversion tracking code:</p>

                <textarea
                    ref={this.codeRef}
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
                                    style={customStyles.copyCode}
                                    alt="copy"
                                    src={CopyIcon}
                                />
                                Copy Tracker Code
                            </span>
                        }
                        color="blue"
                        onClick={this.copySiteTracker}
                        style={customStyles.copyCodeBtn}
                    />
                    {this.state.copiedSiteTracker && (
                        <SuccessBox
                            override={true}
                            style={customStyles.copied}
                            message="Copied!"
                        />
                    )}
                </div>

                <h3 className={styles.subTitle}>How to install</h3>
                <p style={customStyles.pgap}>
                    Copy the code above and paste it immediately after the opening &lt;body&gt; tag of your "thank you" page. 
                    See our guide{' '}
                    <a
                        href="https://help.fraudblocker.com/en/articles/8694696-how-do-i-install-conversion-tracking"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.blueLink}
                    >
                        here
                    </a>
                    .
                </p>
            </div>
        );
    }
}

ConversionTracking.propTypes = {
    activeDomain: PropTypes.object
};

const mapStateToProps = state => ({
    activeDomain: state.activeDomain
});

export default connect(mapStateToProps)(ConversionTracking);