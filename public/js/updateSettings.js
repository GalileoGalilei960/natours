/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
    try {
        const url =
            type === 'password'
                ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
                : 'http://127.0.0.1:3000/api/v1/users/me';

        const res = await axios({
            method: 'PATCH',
            url,
            data,
        });

        if (res.data.status === 'success') {
            showAlert(
                'success',
                `${type.slice(0, 1).toUpperCase() + type.slice(1)} updated successfully!`,
            );
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
        console.log(err.response.data);
    }
};
