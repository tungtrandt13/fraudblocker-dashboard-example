import React, {
    PureComponent
} from 'react';
import Spinner from 'react-spinkit';
import styles from './LoadingSpinner.module.scss';

class LoadingSpinner extends PureComponent {
    render() {
        return ( <
            Spinner className = {
                styles.spinner
            }
            fadeIn = "none"
            name = "double-bounce"
            color = "#286cff" / >
        );
    }
}

export default LoadingSpinner;