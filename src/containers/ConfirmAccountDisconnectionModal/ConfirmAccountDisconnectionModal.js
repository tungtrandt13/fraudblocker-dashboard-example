import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import Button from '../../components/Button/Button';
import WarnIcon from '../../assets/warn-big.svg';
import styles from './ConfirmAccountDisconnectionModal.module.scss';

const customStyles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        overflow: 'auto',
        padding: '40px 0'
    },
    content: {
        width: 500,
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
        height: 'auto',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        padding: '0px',
        position: 'relative'
    }
};

class ConfirmDisconnectionModal extends PureComponent {
    render() {
        const { onCancel, onConfirm, isLoading, recordId, isAll } = this.props;
        
        return (
            <Modal
                isOpen={true}
                style={{
                    ...customStyles,
                    content: {
                        ...customStyles.content,
                        width: isAll ? 600 : 500
                    }
                }}
                contentLabel="Alert"
                ariaHideApp={false}
            >
                <div className={styles.container}>
                    <div className={styles.content}>
                        <div className={styles.contentWrapper}>
                            {isAll && (
                                <img
                                    src={WarnIcon}
                                    alt="warning"
                                    className={styles.removeAccountWarningIcon}
                                />
                            )}
                            <p className={styles.headerText}>
                                {isAll ? 'Remove your Google account' : 'Disconnect this Google Ads Account?'}
                            </p>
                            <p className={styles.descriptionText}>
                                {isAll 
                                    ? 'By removing your Google account, all domain names currently connected to that account will be disconnected from Fraud Blocker. This action will also no longer send invalid IP addresses to your Google Ads account and all existing IP addresses in the IP exclusions of those accounts will be removed in approx. 30 mins.'
                                    : 'This action will no longer send invalid IP addresses to your Google Ads campaigns and all existing IP addresses in the IP exclusions of the account will be removed in approx. 30 mins.'
                                }
                            </p>

                            <div className={styles.btnContainer}>
                                <Button
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    className={styles.cancelActionBtn}
                                    title="Cancel"
                                    color="transparent"
                                />
                                <Button
                                    onClick={() => onConfirm(recordId)}
                                    disabled={isLoading}
                                    loading={isLoading}
                                    className={styles.confirmActionBtn}
                                    title="Continue"
                                    color="lt-blue"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

ConfirmDisconnectionModal.propTypes = {
    isLoading: PropTypes.bool,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func,
    recordId: PropTypes.string,
    type: PropTypes.string,
    isAll: PropTypes.bool
};

export default ConfirmDisconnectionModal;