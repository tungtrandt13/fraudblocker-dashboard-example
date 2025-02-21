import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
// import 'from' './ProgressBar.module.scss';

const ProgressBar = ({ percentage, style, color }) => {
    const [fillStyle, setFillStyle] = useState({
        width: 0,
        backgroundColor: color,
    });

    useEffect(() => {
        // Cập nhật màu ngay lập tức nếu có
        if (color) {
            setFillStyle(prev => ({
                ...prev,
                backgroundColor: color,
            }));
        }

        // Cập nhật width sau 1 giây
        const timer = setTimeout(() => {
            setFillStyle(prev => ({
                ...prev,
                width: `${percentage}%`,
            }));
        }, 1000);

        // Cleanup timer
        return () => clearTimeout(timer);
    }, [color, percentage]);

    return (
        <div className="bar" style={style}>
            <div className="fill" style={fillStyle} />
        </div>
    );
};

ProgressBar.propTypes = {
    percentage: PropTypes.number.isRequired,
    style: PropTypes.object,
    color: PropTypes.string,
};

ProgressBar.defaultProps = {
    style: {},
    color: undefined,
};

export default ProgressBar;
