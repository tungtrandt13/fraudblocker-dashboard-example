import React, {
    PureComponent
} from 'react';
import PropTypes from 'prop-types';

const styles = {
    tooltipLabel: {
        color: '#1660ff',
        fontSize: 14,
        lineHeight: '17px',
        margin: 0,
        padding: 0,
        marginBottom: 5
    },
    tooltipItem: {
        color: '#4a4a4a',
        margin: 0,
        padding: 0,
        fontSize: 14,
        lineHeight: '17px',
        fontWeight: 600,
        marginBottom: 10
    },
    customToolTip: {
        padding: '15px 15px 5px 15px',
        borderRadius: 1,
        boxShadow: `0 4px 15px 0 rgba(152, 169, 188, 0.27)`,
        backgroundColor: '#ffffff'
    }
};
class CustomTooltip extends PureComponent {
    render() {
        const {
            active,
            payload = []
        } = this.props;
        if (active) {
            return ( <
                div style = {
                    styles.customToolTip
                } >
                <
                p style = {
                    styles.tooltipLabel
                } > Ad Visits < /p> <
                p style = {
                    styles.tooltipItem
                } > {
                    payload && payload[0] ?
                    `${Number(payload[0].value).toLocaleString('en-US', { maximumFractionDigits: 1 })}` :
                        ''
                } <
                /p> <
                p style = {
                    styles.tooltipLabel
                } > Invalid Clicks < /p> <
                p style = {
                    styles.tooltipItem
                } > {
                    payload && payload[1] ?
                    `${Number(payload[1].value).toLocaleString('en-US', { maximumFractionDigits: 1 })}` :
                        ''
                } <
                /p> <
                /div>
            );
        }

        return null;
    }
}

CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string
};

export default CustomTooltip;