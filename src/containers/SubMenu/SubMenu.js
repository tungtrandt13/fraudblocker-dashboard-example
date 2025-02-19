import React from 'react';
import PropTypes from 'prop-types';
import styles from './SubMenu.module.scss';
import SubMenuNavItem from './SubMenuNavItem';

function SubMenu({
    group,
    menu,
    location,
    accounts,
    activeDomain,
    setDomain,
    userRole,
    hasMetaAccess
}) {
    const includesDomain = location?.pathname?.includes('domain');

    return (
        <div className={styles.vertical}>
            {group && (
                <div className={styles.groupName}>
                    {group}
                </div>
            )}
            
            {menu.map(item => (
                <SubMenuNavItem
                    key={item.title}
                    item={item}
                    location={location}
                    hasMetaAccess={hasMetaAccess}
                    userRole={userRole}
                    activeDomain={includesDomain ? activeDomain : null}
                    setDomain={includesDomain ? setDomain : null}
                    accounts={includesDomain ? accounts : null}
                />
            ))}
        </div>
    );
}

SubMenu.propTypes = {
    menu: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            // Thêm các prop types khác cho item nếu cần
        })
    ).isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
        // Thêm các prop types khác cho location nếu cần
    }),
    accounts: PropTypes.object,
    hasMetaAccess: PropTypes.bool,
    activeDomain: PropTypes.object,
    setDomain: PropTypes.func,
    userRole: PropTypes.string,
    group: PropTypes.string
};

SubMenu.defaultProps = {
    hasMetaAccess: false,
    menu: [],
    group: '',
    userRole: '',
    location: { pathname: '' }
};

export default React.memo(SubMenu);