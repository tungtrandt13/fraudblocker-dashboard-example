import React, {
    PureComponent
} from 'react';
import PropTypes from 'prop-types';
import styles from './SubMenu.module.scss';
import SubMenuNavItem from './SubMenuNavItem';

class SubMenu extends PureComponent {
    render() {
        const {
            group,
            menu,
            location,
            accounts,
            activeDomain,
            setDomain,
            userRole,
            hasMetaAccess
        } = this.props;
        const includesDomain = location.pathname.includes('domain');
        console.log(menu);

        return ( <
            div className = {
                styles.vertical
            } > {
                group && < div className = {
                    styles.groupName
                } > {
                    group
                } < /div>} {
                    menu.map(item => {
                        return ( <
                            SubMenuNavItem activeDomain = {
                                includesDomain ? activeDomain : null
                            }
                            setDomain = {
                                includesDomain ? setDomain : null
                            }
                            accounts = {
                                includesDomain ? accounts : null
                            }
                            location = {
                                location
                            }
                            hasMetaAccess = {
                                hasMetaAccess
                            }
                            key = {
                                item.title
                            }
                            item = {
                                item
                            }
                            userRole = {
                                userRole
                            }
                            />
                        );
                    })
                } <
                /div>
            );
        }
    }

    SubMenu.propTypes = {
        menu: PropTypes.array.isRequired,
        location: PropTypes.object,
        accounts: PropTypes.object,
        hasMetaAccess: PropTypes.bool,
        activeDomain: PropTypes.object,
        setDomain: PropTypes.func,
        userRole: PropTypes.string,
        group: PropTypes.string
    };

    export default SubMenu;