import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function RouteChangeHandler({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Effect sẽ chạy mỗi khi location thay đổi
        if (window.Intercom) {
            window.Intercom('update');
        }
        window.scrollTo(0, 0);
    }, [location]);

    return children;
}

RouteChangeHandler.propTypes = {
    children: PropTypes.node
};

export default RouteChangeHandler;