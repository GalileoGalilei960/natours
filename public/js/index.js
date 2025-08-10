/*eslint-disable*/
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';
import axios from 'axios';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
const signupForm = document.querySelector('.form--signup');

// DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
    userDataForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        updateSettings(form, 'data');
    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent =
            'Updating...';

        const passwordCurrent =
            document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm =
            document.getElementById('password-confirm').value;
        await updateSettings(
            { passwordCurrent, password, passwordConfirm },
            'password',
        );

        document.querySelector('.btn--save-password').textContent =
            'Save password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = signupForm.querySelector(
            'button[type="submit"], button:not([type])',
        );
        const originalBtnText = btn.textContent;

        btn.textContent = 'Signing up...';
        btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('name', document.getElementById('name').value);
            formData.append('email', document.getElementById('email').value);
            formData.append(
                'password',
                document.getElementById('password').value,
            );
            formData.append(
                'passwordConfirm',
                document.getElementById('passwordConfirm').value,
            );
            // Ось тут треба додати сам файл:
            formData.append('photo', document.getElementById('photo').files[0]);

            const res = await axios({
                method: 'POST', // signup має бути POST!
                url: '/api/v1/users/signup',
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data.status !== 'success') {
                throw new Error(res.data.message || 'Failed to sign up');
            }

            showAlert('success', 'Sign up successful! Redirecting...');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        } catch (err) {
            showAlert('error', err.message);
        } finally {
            btn.textContent = originalBtnText;
            btn.disabled = false;
        }
    });
}

const alertMessage = new URLSearchParams(window.location.search).get('alert');
if (alertMessage) showAlert('success', alertMessage, 20);
