import React, {
    PureComponent
} from 'react';
import PropTypes from 'prop-types';
import {
    Link
} from 'react-router-dom';
import styles from './SubMenu.module.scss';
import User from '../../redux/actions/User';
import SubNavLink from './SubNavLink';

class SubMenuNavItem extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isExpanded: false
        };
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({
                isExpanded: this.props.item &&
                    this.props.item.title &&
                    (this.props.item.title.toLowerCase().includes('setting') ||
                        this.props.item.title.toLowerCase().includes('advertising'))
            });
        }, 1000);
    }

    componentWillUnmount() {
        this.setState({
            isExpanded: false
        });
    }

    toggleOptions = () => {
        this.setState({
            isExpanded: !this.state.isExpanded
        });
    };

    signOut = () => {
        User.signOut();
    };

    renderDomains = () => {
        const {
            accounts,
            setDomain,
            activeDomain
        } = this.props;

        // console.log('renderDomains', activeDomain);
        if (activeDomain) {
            const filteredDomains = accounts.data.domains.filter(
                domain => domain.id !== activeDomain.data.id
            );
            return filteredDomains.map(domain => {
                return <DomainNavItem key = {
                    domain.id
                }
                onClick = {
                    setDomain
                }
                domain = {
                    domain
                }
                />;
            });
        }
        return null;
    };

    componentDidUpdate = prevProps => {
        const {
            accounts,
            setDomain,
            activeDomain
        } = this.props;
        const {
            accounts: prevAccounts
        } = prevProps;
        const totalDomains = accounts && accounts.data ? accounts.data.domains.length : 0;
        if (
            activeDomain &&
            totalDomains > prevAccounts.data.domains.length &&
            activeDomain.id !== accounts.data.domains[totalDomains - 1].id
        ) {
            setDomain(accounts.data.domains[totalDomains - 1]);
        }
    };

    render() {
        const {
            item,
            location,
            accounts,
            userRole,
            hasMetaAccess
        } = this.props;
        console.log(userRole);
        console.log(item);
        const hasOptions = item.options && item.options.length > 0;
        const isNavActive = location.pathname.includes(item.route) && !hasOptions;
        const includesDomain = location.pathname.includes('domain');
        const parentNavStyle = !hasOptions ?
            `${styles.navItemTitle} ${styles.withHover}` :
            styles.navItemTitle;

        return ( <
            div className = {
                styles.navItem
            } > {
                item.route === '/logout' ? ( <
                    a onClick = {
                        this.signOut
                    }
                    className = {
                        isNavActive ? styles.navItemTitleActive : parentNavStyle
                    } >
                    <
                    item.icon className = {
                        styles.icon
                    }
                    /> <
                    p > {
                        item.title
                    } < /p> <
                    /a>
                ) : ( <
                    SubNavLink isDisabled = {
                        item.protected &&
                        (userRole === 'Viewer' || (item.blockForRoles && item.blockForRoles.includes(userRole)))
                    }
                    item = {
                        item
                    }
                    location = {
                        location
                    }
                    toggleOptions = {
                        this.toggleOptions
                    }
                    isExpanded = {
                        this.state.isExpanded
                    }
                    />
                )
            } {
                includesDomain && accounts.data.domains.length > 1 && this.renderDomains()
            } <
            div className = {
                `${styles.hasMenuItem} ${hasOptions &&
            !this.state.isExpanded &&
            styles.removeMenuItemActive} ${hasOptions &&
            this.state.isExpanded &&
            styles.hasMenuItemActive}`
            } >
            {
                hasOptions &&
                item.options.map(link => {
                    const isActive = location.pathname.includes(link.route);
                    if (link.text === 'Meta Ads' && !hasMetaAccess) {
                        return null;
                    }
                    const disabledForViewer =
                        link.protected &&
                        (userRole === 'Viewer' || (link.blockForRoles && link.blockForRoles.includes(userRole)));
                    return link.route ? (!link.isExternal ? ( <
                        Link to = {
                            link.route
                        }
                        className = {
                            `${isActive ? styles.subNavItemActive : styles.subNavItem} ${disabledForViewer ? styles.disabledForViewer : ''
                      }`
                        }
                        key = {
                            link.route
                        } >
                        <
                        p > {
                            link.text
                        } < /p> <
                        /Link>
                    ) : ( <
                        a target = "_blank"
                        rel = "noopener noreferrer"
                        href = {
                            link.route
                        }
                        key = {
                            link.route
                        }
                        className = {
                            `${isActive ? styles.subNavItemActive : styles.subNavItem} ${disabledForViewer ? styles.disabledForViewer : ''
                      }`
                        } >
                        <
                        p > {
                            link.text
                        } < /p> <
                        /a>
                    )) : ( <
                        p key = {
                            link.text
                        }
                        dangerouslySetInnerHTML = {
                            {
                                __html: link.text
                            }
                        }
                        className = {
                            `${styles.subNavItem} ${styles.comingSoon}`
                        }
                        />
                    );
                })
            } <
            /div> <
            /div>
        );
    }
}

SubMenuNavItem.propTypes = {
    item: PropTypes.object.isRequired,
    location: PropTypes.object,
    accounts: PropTypes.object,
    setDomain: PropTypes.func,
    activeDomain: PropTypes.object,
    userRole: PropTypes.string,
    hasMetaAccess: PropTypes.bool
};

class DomainNavItem extends PureComponent {
    onClick = () => {
        const {
            domain,
            onClick
        } = this.props;
        onClick(domain);
    };

    render() {
        const {
            domain
        } = this.props;
        return ( <
            a onClick = {
                this.onClick
            }
            className = {
                styles.subNavItem
            } >
            <
            div className = {
                styles.subPlaceholder
            }
            /> <
            p > {
                domain.domain_name
            } < /p> <
            /a>
        );
    }
}

DomainNavItem.propTypes = {
    domain: PropTypes.object,
    onClick: PropTypes.func
};

export default SubMenuNavItem;