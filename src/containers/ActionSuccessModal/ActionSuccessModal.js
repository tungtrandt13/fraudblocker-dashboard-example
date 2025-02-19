import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import Button from '../../components/Button/Button';
import styles from './ActionSuccessModal.module.scss';
import BadgeIcon from '../../assets/badge.svg';

const modalStyles = {
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
        width: 600,
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
        height: 'auto',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        padding: '30px',
        position: 'relative',
        border: 'none'
    }
};

const buttonPropType = PropTypes.shape({
    title: PropTypes.string.isRequired,
    action: PropTypes.func.isRequired,
    color: PropTypes.string.isRequired
});

function ActionSuccessModal({
    isOpen,
    toggleModal,
    buttons = [],
    description = '',
    isClosable = true,
    title = "You're All Set"
}) {
    const handleClose = () => {
        if (isClosable && toggleModal) {
            toggleModal();
        }
    };

    const renderCloseButton = () => {
        if (!isClosable) return null;

        return (
            <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClose}
                aria-label="Close modal"
            >
                ×
            </button>
        );
    };

    const renderButtons = () => {
        if (!buttons.length) return null;

        return (
            <div className={styles.btnContainer}>
                {buttons.map((button, index) => (
                    <Button
                        key={`${button.title}-${index}`}
                        onClick={button.action}
                        title={button.title}
                        color={button.color}
                        className={styles.actionButton}
                    />
                ))}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            style={modalStyles}
            contentLabel="Success Alert"
            ariaHideApp={false}
            onRequestClose={handleClose}
        >
            <div className={styles.container}>
                {renderCloseButton()}
                
                <div className={styles.content}>
                    <div className={styles.contentWrapper}>
                        <div className={styles.imgContain}>
                            <img 
                                src={BadgeIcon} 
                                className={styles.icon} 
                                alt="Success badge"
                            />
                        </div>

                        <h2 className={styles.headerText}>
                            {title}
                        </h2>

                        {description && (
                            <p className={styles.descriptionText}>
                                {description}
                            </p>
                        )}

                        {renderButtons()}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

ActionSuccessModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func,
    description: PropTypes.string,
    buttons: PropTypes.arrayOf(buttonPropType),
    isClosable: PropTypes.bool,
    title: PropTypes.string
};

export default React.memo(ActionSuccessModal);