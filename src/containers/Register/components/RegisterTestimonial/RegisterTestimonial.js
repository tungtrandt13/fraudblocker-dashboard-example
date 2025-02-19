import React from 'react';
import PropTypes from 'prop-types';
import styles from './RegisterTestimonial.module.scss';
import STARS from '../../../../assets/stars-new.svg';
import GOOGLEAPI from '../../../../assets/g-api.svg';
import FACEBOOK from '../../../../assets/fb-icon.svg';
import INSTAGRAM from '../../../../assets/insta-icon.svg';
import TECHTIMES from '../../../../assets/tech-times.svg';
import TESTIMONIAL from '../../../../assets/testimonial.png';
import TWO_FOUR from '../../../../assets/247.svg';
import CODE from '../../../../assets/ez.svg';

const Feature = ({ icon, title, description }) => (
    <div className={styles.checkFeatures}>
        <img src={icon} className={styles.icon} alt={title} />
        <div>
            <div className={styles.checkTitle}>{title}</div>
            <div className={styles.checkText}>{description}</div>
        </div>
    </div>
);

const Testimonial = () => (
    <div className={styles.testimonialContainer}>
        <div className={styles.testimonialLogo}>
            <img src={TESTIMONIAL} alt="testimonial" />
        </div>
        <div>
            <div className={styles.stars}>
                <img src={STARS} alt="stars" />
            </div>
            <p className={styles.testimonialText}>
                "They greatly reduced my ad fraud and improved my campaign performance. Highly recommend!"
            </p>
            <p className={styles.testimonialAuthor}>Matthew C., Sr. Marketing Manager</p>
        </div>
    </div>
);

const TechSection = () => (
    <div className={styles.techSec}>
        <div className={styles.techImg}>
            <img src={TECHTIMES} alt="tech times" />
        </div>
        <div className={styles.apiApp}>
            <div>
                <img src={GOOGLEAPI} alt="google api" />
                <img src={FACEBOOK} alt="facebook" />
                <img src={INSTAGRAM} alt="instagram" />
            </div>
            <div className={styles.gApi}>Google & Meta API approved</div>
        </div>
    </div>
);

const RegisterTestimonial = () => {
    const features = [
        {
            icon: TWO_FOUR,
            title: '24/7 Account Support',
            description: 'Email, call or chat with our team anytime'
        },
        {
            icon: CODE,
            title: 'Easy Installation - No developer needed',
            description: 'Install in minutes and start blocking fraud today'
        }
    ];

    return (
        <div className={styles.registerTestimonialContainer}>
            <div className={styles.registerTestimonialContent}>
                <Testimonial />
                <TechSection />
                {features.map((feature, index) => (
                    <Feature
                        key={index}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                    />
                ))}
            </div>
        </div>
    );
};

// PropTypes for Feature component
Feature.propTypes = {
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
};

export default RegisterTestimonial;