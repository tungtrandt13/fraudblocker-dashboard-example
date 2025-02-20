import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import ArrowRight from "../../assets/dropdown-arrow.svg";
import styles from "./SubMenu.module.scss";

const SubNavLink = ({ item, location, isDisabled, toggleOptions = () => {}, isExpanded }) => {
    const isNavActive = location.pathname.includes(item.route);
    const hasOptions = item.options?.length > 0;
    const parentNavStyle = !hasOptions ? `${styles.navItemTitle} ${styles.withHover}` : styles.navItemTitle;

    const commonClassNames = `
        ${isNavActive ? styles.navItemTitleActive : parentNavStyle}
        ${isDisabled ? styles.disabledForViewer : ""}
    `.trim();

    const renderIcon = () => {
        if (!item.icon) return null;
        return <item.icon className={styles.icon} />;
    };

    if (!item.route) {
        return (
            <div
                onClick={toggleOptions}
                className={`
                    ${styles.navItemTitle}
                    ${isExpanded ? styles.navActive : ""}
                    ${isDisabled ? styles.disabledForViewer : ""}
                `.trim()}
            >
                {renderIcon()}
                <p>{item.title}</p>
                {hasOptions && (
                    <img
                        className={`
                            ${styles.expandIcon}
                            ${!isExpanded ? styles.expandIconClosed : ""}
                        `.trim()}
                        src={ArrowRight}
                        alt="expand"
                    />
                )}
            </div>
        );
    }

    if (item.isExternal) {
        return (
            <a href={item.route} target="_blank" rel="noopener noreferrer" className={commonClassNames}>
                {renderIcon()}
                <p>{item.title}</p>
            </a>
        );
    }

    return (
        <Link to={item.route} className={commonClassNames}>
            {renderIcon()}
            <p>{item.title}</p>
        </Link>
    );
};

SubNavLink.propTypes = {
    item: PropTypes.shape({
        route: PropTypes.string,
        isExternal: PropTypes.bool,
        icon: PropTypes.elementType,
        title: PropTypes.string.isRequired,
        options: PropTypes.arrayOf(
            PropTypes.shape({
                // Define option shape if needed
            })
        ),
    }).isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
    }).isRequired,
    isDisabled: PropTypes.bool,
    toggleOptions: PropTypes.func,
    isExpanded: PropTypes.bool,
};

SubNavLink.defaultProps = {
    isDisabled: false,
    toggleOptions: () => {},
    isExpanded: false,
};

export default React.memo(SubNavLink);
