import React from "react";
import PropTypes from "prop-types";
import {Tooltip} from "react-tooltip";
import DRIVE_ICON from "../../assets/drive_icon.svg";
import DRIVE_ICON_WHITE from "../../assets/drive-icon-white.svg";
import META_ICON from "../../assets/meta-ads-icon.png";
import {ReactComponent as META_ICON_WHITE} from "../../assets/meta-white.svg";
import styles from "./AdSelector.module.scss";

const AdSelector = ({handleAdChange, showAll = false}) => {
    const [selectedAd, setSelectedAd] = React.useState(showAll ? "all" : "gclid");

    const onChange = (ad) => {
        setSelectedAd(ad);
        handleAdChange({
            adType: ad,
        });
    };

    return (
        <div className={styles.adSelectorWrap}>
            <Tooltip id="fbclidAds"/>
            {showAll && (
                <div
                    role="button"
                    className={selectedAd === "all" ? styles.active : ""}
                    onClick={() => onChange("all")}
                    data-tooltip-id="fbclidAds" // Liên kết tooltip với id "fbclidAds"
                    data-tooltip-content="Show All Tooltip" // Nội dung tooltip (tùy chọn)
                >
                    Show All
                </div>
            )}
            <div
                role="button"
                className={selectedAd === "gclid" ? styles.active : ""}
                onClick={() => onChange("gclid")}
                data-tooltip-id="fbclidAds" // Liên kết tooltip với id "fbclidAds"
                data-tooltip-content="Google Ads Tooltip" // Nội dung tooltip (tùy chọn)
            >
                <img src={selectedAd === "gclid" ? DRIVE_ICON_WHITE : DRIVE_ICON} alt="gclid"/>
                Google Ads
            </div>
            <div
                className={selectedAd === "fbclid" ? styles.active : ""}
                role="button"
                onClick={() => onChange("fbclid")}
                data-tooltip-id="fbclidAds" // Liên kết tooltip với id "fbclidAds"
                data-tooltip-content="Meta Ads Tooltip" // Nội dung tooltip (tùy chọn)
            >
                {selectedAd === "fbclid" ? (
                    <META_ICON_WHITE className={styles.metaImg}/>
                ) : (
                    <img className={styles.metaImg} src={META_ICON} alt="fbclid"/>
                )}
                Meta Ads
            </div>
        </div>
    );
};

AdSelector.propTypes = {
    handleAdChange: PropTypes.func.isRequired,
    showAll: PropTypes.bool.isRequired,
};

AdSelector.defaultProps = {
    showAll: false
};

// Suggested CSS improvements
const suggestedStyles = `
.adSelectorWrap {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: var(--bg-color, #fff);
}

.adButton {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
        background: var(--hover-bg, rgba(0, 0, 0, 0.05));
    }

    &:focus-visible {
        outline: 2px solid var(--focus-color, #0066cc);
        outline-offset: 2px;
    }

    &.active {
        background: var(--active-bg, #0066cc);
        color: var(--active-text, #fff);
    }
}

.adIcon {
    width: 1.5rem;
    height: 1.5rem;
    object-fit: contain;
}

.metaImg {
    width: 1.5rem;
    height: 1.5rem;

    &.white {
        filter: brightness(0) invert(1);
    }
}
`;

export default React.memo(AdSelector);