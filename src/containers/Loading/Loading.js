import React from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import styles from './Loading.module.scss';

function Loading({ text = 'Loading...', size = 'medium' }) {
    return (
        <div className={styles.container}>
            <LoadingSpinner size={size} />
            {text && <p className={styles.loadingText}>{text}</p>}
        </div>
    );
}

Loading.propTypes = {
    text: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default Loading;