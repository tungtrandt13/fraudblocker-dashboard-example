import React from 'react';
import PropTypes from 'prop-types';
import styles from './InputContainer.module.scss';

function InputContainer({
    containerStyle = {},
    labelStyle = {},
    label,
    children
}) {
    return (
        <div 
            style={containerStyle} 
            className={styles.container}
        >
            {label && (
                <p 
                    className={styles.label} 
                    style={labelStyle}
                >
                    {label}
                </p>
            )}
            {children}
        </div>
    );
}

InputContainer.propTypes = {
    containerStyle: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string
    ]),
    labelStyle: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string
    ]),
    label: PropTypes.node,
    children: PropTypes.node
};

InputContainer.defaultProps = {
    containerStyle: {},
    labelStyle: {},
    label: null,
    children: null
};

export default React.memo(InputContainer);