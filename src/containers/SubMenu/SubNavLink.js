import React, {
    PureComponent
} from 'react';
import PropTypes from 'prop-types';
import {
    Link
} from 'react-router-dom';
import ArrowRight from '../../assets/dropdown-arrow.svg';
import styles from './SubMenu.module.scss';

class SubNavLink extends PureComponent {
    render() {
            const {
                item,
                location,
                isDisabled,
                toggleOptions = () => {},
                isExpanded
            } = this.props;
            const isNavActive = location.pathname.includes(item.route);
            const hasOptions = item.options && item.options.length > 0;
            const parentNavStyle = !hasOptions ?
                `${styles.navItemTitle} ${styles.withHover}` :
                styles.navItemTitle;
            return item.route ? (!item.isExternal ? ( <
                        Link to = {
                            item.route
                        }
                        className = {
                            `${isNavActive ? styles.navItemTitleActive : parentNavStyle} ${isDisabled ? styles.disabledForViewer : ''
            }`
                        } >
                        {
                            item.icon && < item.icon className = {
                                styles.icon
                            }
                            />} <
                            p > {
                                item.title
                            } < /p> <
                            /Link>
                        ): ( <
                            a target = "_blank"
                            rel = "noopener noreferrer"
                            href = {
                                item.route
                            }
                            className = {
                                `${isNavActive ? styles.navItemTitleActive : parentNavStyle} ${isDisabled ? styles.disabledForViewer : ''
            }`
                            } >
                            {
                                item.icon && < item.icon className = {
                                    styles.icon
                                }
                                />} <
                                p > {
                                    item.title
                                } < /p> <
                                /a>
                            )
                        ): ( <
                            div onClick = {
                                toggleOptions
                            }
                            className = {
                                `${styles.navItemTitle} ${isExpanded && styles.navActive} ${isDisabled ? styles.disabledForViewer : ''
          }`
                            } >
                            {
                                item.icon && < item.icon className = {
                                    styles.icon
                                }
                                />} <
                                p > {
                                    item.title
                                } < /p> {
                                    hasOptions && ( <
                                        img className = {
                                            `${styles.expandIcon} ${!isExpanded && styles.expandIconClosed}`
                                        }
                                        src = {
                                            ArrowRight
                                        }
                                        />
                                    )
                                } <
                                /div>
                            );
                        }
                    }

                    SubNavLink.propTypes = {
                        item: PropTypes.object.isRequired,
                        location: PropTypes.object,
                        isDisabled: PropTypes.bool,
                        toggleOptions: PropTypes.func,
                        isExpanded: PropTypes.bool
                    };

                    export default SubNavLink;