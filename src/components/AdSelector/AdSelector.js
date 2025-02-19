import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import DRIVE_ICON from '../../assets/drive_icon.svg';
import DRIVE_ICON_WHITE from '../../assets/drive-icon-white.svg';
// import MICROSOFT_ICON from '../../assets/microsoft-ads-icon.png';
// import MICROSOFT_WHITE_ICON from '../../assets/microsoft-white.svg';
import META_ICON from '../../assets/meta-ads-icon.png';
import {
    ReactComponent as META_ICON_WHITE
} from '../../assets/meta-white.svg';
import styles from './AdSelector.module.scss';

const AdSelector = ({
    handleAdChange,
    showAll = false
}) => {
    const [selectedAd, setSelectedAd] = React.useState(showAll ? 'all' : 'gclid');

    React.useEffect(() => {
        ReactTooltip.rebuild();
    }, []);

    const onChange = ad => {
        setSelectedAd(ad);
        handleAdChange({
            adType: ad
        });
    };

    return ( <
        div className = {
            styles.adSelectorWrap
        } >
        <
        ReactTooltip id = "fbclidAds" / > {
            showAll && ( <
                div role = "button"
                className = {
                    selectedAd === 'all' ? styles.active : ''
                }
                onClick = {
                    () => onChange('all')
                } >
                Show All <
                /div>
            )
        } <
        div role = "button"
        className = {
            selectedAd === 'gclid' ? styles.active : ''
        }
        onClick = {
            () => onChange('gclid')
        } >
        <
        img src = {
            selectedAd === 'gclid' ? DRIVE_ICON_WHITE : DRIVE_ICON
        }
        alt = "gclid" / >
        Google Ads <
        /div> {
            /* <div
                    role="button"
                    className={selectedAd === 'msclkid' ? styles.active : ''}
                    onClick={() => onChange('msclkid')}
                  >
                    <img src={selectedAd === 'msclkid' ? MICROSOFT_WHITE_ICON : MICROSOFT_ICON} alt="msclkid" />
                    Microsoft Ads
                  </div> */
        } <
        div className = {
            selectedAd === 'fbclid' ? styles.active : ''
        }
        role = "button"
        onClick = {
            () => onChange('fbclid')
        } >
        {
            selectedAd === 'fbclid' ? ( <
                META_ICON_WHITE className = {
                    styles.metaImg
                }
                />
            ) : ( <
                img className = {
                    styles.metaImg
                }
                src = {
                    META_ICON
                }
                alt = "fbclid" / >
            )
        }
        Meta Ads <
        /div> <
        /div>
    );
};

AdSelector.propTypes = {
    handleAdChange: PropTypes.func.isRequired,
    showAll: PropTypes.bool.isRequired
};

export default React.memo(AdSelector);