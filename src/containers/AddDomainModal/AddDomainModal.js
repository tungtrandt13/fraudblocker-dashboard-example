/* eslint-disable react/no-unescaped-entities */
import React, {
    PureComponent
} from 'react';
import {
    parseDomain,
    fromUrl
} from 'parse-domain';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import {
    connect
} from 'react-redux';
import styles from './AddDomainModal.module.scss';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import ErrorBox from '../../components/ErrorBox/ErrorBox';
import Account from '../../redux/actions/Account';
import ActiveDomain from '../../redux/actions/ActiveDomain';
import Domains from '../../api/Domains';
// import UserApi from '../../api/Users';
import Utils from '../../utils/Utils';

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
        position: 'relative',
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
        width: 410,
        height: 'auto',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        padding: '65px'
    },
    addDomainBtn: {
        alignSelf: 'center'
    },
    inputStyle: {
        maxWidth: 400,
        alignSelf: 'center',
        marginBottom: '30px',
        marginTop: '30px',
        width: '220px'
    },
    fieldError: {
        alignSelf: 'center'
    }
};

class AddDomainModal extends PureComponent {
    state = {
        domain: '',
        loading: false,
        errors: {},
        existingDomain: null
    };

    handleCloseModal = () => {
        const {
            onCancel
        } = this.props;
        if (onCancel) {
            this.setState({
                domain: ''
            });
            onCancel();
        }
    };

    onInputChange = event => {
        const {
            value,
            name
        } = event.target;
        this.setState({
            [name]: value
        });
    };

    validateDomain = (domain, subscription, accounts) => {
        if (!accounts.data) return false;

        if (!subscription) {
            this.setState({
                errors: {
                    addDomain: 'Please upgrade your plan to add a website'
                }
            });
            return false;
        }

        const activeDomains = accounts.data.domains.filter(item => !item.is_deleted);
        const maxDomains = subscription.plan?.metadata.domains;
        const extraDomains = parseInt(subscription.metadata?.domain, 10) || 0;

        if (maxDomains !== 'unlimited' && 
            activeDomains.length >= maxDomains && 
            activeDomains.length >= extraDomains) {
            this.setState({
                errors: {
                    addDomain: 'Please upgrade your plan to add new website'
                }
            });
            return false;
        }

        const parseResult = parseDomain(fromUrl(domain));

        if (domain.includes('@') || !parseResult || parseResult.type !== 'LISTED') {
            this.setState({
                errors: {
                    addDomain: 'Please enter a valid domain'
                }
            });
            return false;
        }

        return parseResult;
    };

    onClickAddDomain = async () => {
        this.setState({
            errors: {
                addDomain: '',
                apiError: ''
            },
            existingDomain: null
        });

        const {
            domain
        } = this.state;
        const {
            accounts = {}, fetchLatestAccount, setDomain, auth
        } = this.props;
        const subscription = Utils.getSingleSubscription(accounts, accounts.data.id);

        const parseResult = this.validateDomain(domain, subscription, accounts);
        if (!parseResult) return;

        let parsedDomain = `${parseResult.icann.domain}.${parseResult.icann.topLevelDomains.join('.')}`;
        if (parseResult.icann.subDomains && parseResult.icann.subDomains.length) {
            const subDomains = parseResult.icann.subDomains.filter(
                name => name.toLocaleLowerCase() !== 'www'
            );
            if (subDomains.length) {
                parsedDomain = `${subDomains.join('.')}.${parsedDomain}`;
            }
        }

        this.setState({
            loading: true
        });
        console.log('Add domain: ', parsedDomain);

        const addDomainData = {
            domain_name: parsedDomain,
            account_id: accounts.data.id
        };

        try {
            const domainExistsOnAccount = accounts.data.domains.find(
                accountDomain => parsedDomain === accountDomain.domain_name
            );

            if (domainExistsOnAccount) {
                if (domainExistsOnAccount.is_deleted) {
                    this.setState({
                        existingDomain: domainExistsOnAccount
                    });
                    throw Error('removed');
                } else {
                    throw Error('Website already exists on your account.');
                }
            }

            // let domainWithProtocol = parsedDomain;
            // if (!domainWithProtocol.includes('http')) {
            //   domainWithProtocol = `http://${domainWithProtocol}`;
            // }
            // const domainResponse = await UserApi.checkIfDomainActive(domainWithProtocol);
            // if (!domainResponse) {
            //   throw new Error('Error creating user account');
            // }

            const domainRes = await Domains.addDomain(addDomainData);

            window.Intercom('trackEvent', 'add-domain', {
                domain: parsedDomain
            });

            await fetchLatestAccount(accounts.data.id);

            window.Intercom('update', {
                user_id: auth.user.id,
                business_domain: accounts.data.domains.map(item => item.domain_name).join(',')
            });

            this.setState({
                loading: false
            });
            setDomain(domainRes);
            if (this.props.onSuccess) {
                this.setState({
                    domain: ''
                });
                this.props.onSuccess();
            }
        } catch (error) {
            this.setState({
                errors: {
                    apiError: error.message
                },
                loading: false
            });
        }
    };

    restoreDomain = async () => {
        const {
            existingDomain,
            loading
        } = this.state;
        if (!existingDomain || loading) return;

        this.setState({
            loading: true
        });
        const {
            accounts = {}, fetchLatestAccount, setDomain, auth
        } = this.props;

        const response = await Domains.restoreDomain(existingDomain.id);

        window.Intercom('trackEvent', 'add-domain', {
            domain: existingDomain.domain_name
        });

        await fetchLatestAccount(accounts.data.id);

        window.Intercom('update', {
            user_id: auth.user.id,
            business_domain: accounts.data.domains.map(item => item.domain_name).join(',')
        });

        this.setState({
            loading: false,
            existingDomain: null,
            domain: ''
        });
        setDomain(response);
        if (this.props.onSuccess) {
            this.props.onSuccess();
        }
    };

    render() {
        const {
            domain,
            loading,
            errors,
            existingDomain
        } = this.state;
        const {
            isOpen,
            forceToAdd,
            onCancelAccount
        } = this.props;

        return (
            <Modal
                isOpen={isOpen}
                style={customStyles}
                contentLabel="Add Website Modal"
                ariaHideApp={false}
            >
                <div className={styles.container}>
                    {!forceToAdd && (
                        <span 
                            className={styles.closeBtn}
                            onClick={this.handleCloseModal}
                            aria-hidden="true"
                        >
                            ×
                        </span>
                    )}

                    <div className={styles.content}>
                        <p className={styles.addNewDomainText}>Add New Website</p>
                        <div>
                            {!forceToAdd ? (
                                <p className={styles.descriptionText}>
                                    To begin fraud detection on a new website, enter the domain address.
                                </p>
                            ) : (
                                <p className={styles.mustAddText}>
                                    You do not have any active website in your account. Please add a new website below or{' '}
                                    <button 
                                        onClick={onCancelAccount}
                                        className={styles.linkButton}
                                    >
                                        go here
                                    </button> to cancel your entire account.
                                </p>
                            )}
                        </div>

                        <Input
                            onChange={this.onInputChange}
                            value={domain}
                            name="domain"
                            style={customStyles.inputStyle}
                            placeholder="example.com"
                        />

                        {errors.addDomain && <ErrorBox error={errors.addDomain} />}
                        
                        {errors.apiError && !errors.apiError.includes('removed') && (
                            <ErrorBox error={errors.apiError} />
                        )}

                        {errors.apiError && errors.apiError.includes('removed') && (
                            loading && existingDomain ? (
                                <ErrorBox error="Restoring" />
                            ) : (
                                <ErrorBox
                                    error={
                                        <div>
                                            Website exists in your deleted domains. Please{' '}
                                            <button
                                                style={{
                                                    color: '#fc584e',
                                                    textDecoration: 'underline',
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer'
                                                }}
                                                onClick={this.restoreDomain}
                                            >
                                                restore it.
                                            </button>
                                        </div>
                                    }
                                />
                            )
                        )}

                        <Button
                            onClick={this.onClickAddDomain}
                            title="Add Website"
                            loading={loading}
                            color="lt-blue"
                            style={customStyles.addDomainBtn}
                            disabled={!domain}
                        />
                    </div>
                </div>
            </Modal>
        );
    }
}

AddDomainModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    accounts: PropTypes.object,
    auth: PropTypes.object,
    fetchLatestAccount: PropTypes.func,
    setDomain: PropTypes.func,
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func,
    forceToAdd: PropTypes.bool,
    onCancelAccount: PropTypes.func
};

const mapStateToProps = state => ({
    accounts: state.accounts,
    auth: state.auth
});

const mapDispatchToProps = dispatch => {
    return {
        fetchLatestAccount: accountId => dispatch(Account.fetchLatestAccount(accountId)),
        setDomain: domain => dispatch(ActiveDomain.setDomainActive(domain))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(AddDomainModal);