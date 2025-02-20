import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import Button from '../../components/Button/Button';
import styles from './AddDomainSuccessModal.module.scss';
import Badge from '../../assets/badge.svg';

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
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
        width: 400,
        height: 'auto',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        padding: '75px',
        position: 'relative'
    }
};

class AddDomainSuccessModal extends PureComponent {
    handleCloseModal = () => {
        this.props.toggleModal();
    };

    goToDashboard = () => {
        const { history, toggleModal } = this.props;
        history.push('/integrations/fraud-blocker-tracker');
        toggleModal();
    };

    render() {
        const { isOpen } = this.props;

        return (
            <Modal
                isOpen={isOpen}
                style={customStyles}
                ariaHideApp={false}
                contentLabel="Compare Plans"
            >
                <div className={styles.container}>
                    <span 
                        className={styles.closeBtn}
                        onClick={this.handleCloseModal}
                        aria-hidden="true"
                    >
                        ×
                    </span>
                    
                    <div className={styles.content}>
                        <div className={styles.headerText}>
                            <div className={styles.imgSec}>
                                <img src={Badge} className={styles.icon} alt="success" />
                            </div>
                            
                            <div className={styles.textSecHead}>
                                You're All Set
                                <span>Your new domain has been added.</span>
                                <span>
                                    You must install a new tracking pixel to begin monitoring for fraud.
                                </span>
                            </div>
                        </div>

                        <div className={styles.btnWrapper}>
                            <Button
                                onClick={this.goToDashboard}
                                title="Install Fraud Blocker"
                                color="lt-blue"
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

AddDomainSuccessModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    history: PropTypes.object
};

export default AddDomainSuccessModal;