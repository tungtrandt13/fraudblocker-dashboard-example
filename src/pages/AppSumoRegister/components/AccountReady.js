import React from 'react';
import PropTypes from 'prop-types';
import ActionSuccessModal from '../../../containers/ActionSuccessModal/ActionSuccessModal';

const AccountReadyModal = props => {
    return ( <
        ActionSuccessModal { ...props
        }
        description = "Your AppSumo plan has been added."
        isClosable = {
            false
        }
        />
    );
};

AccountReadyModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    buttons: PropTypes.array
};

export default AccountReadyModal;