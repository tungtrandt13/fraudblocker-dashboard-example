import React from 'react';
import { ReactComponent as MAINLOGO } from '../../assets/main-logo.svg';
import styles from './Footer.module.scss';

function Footer() {
    return (
        <div className={styles.footer}>
            <div className={styles.divider} />
            <div className={styles.footerContent}>
                <MAINLOGO />
                <p>
                    ©2024 All Rights Reserved. Fraud Blocker™ is a registered trademark of Fraud Blocker LLC.
                </p>
                <p>
                    <span>
                        <a 
                            className="blue"
                            href="https://fraudblocker.com/privacy/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Privacy Policy
                        </a>
                    </span>
                    {' '}and{' '}
                    <span>
                        <a 
                            className="blue"
                            href="https://fraudblocker.com/terms/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Terms of Service
                        </a>
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Footer;