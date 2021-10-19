import React, {FC} from 'react';
import classes from './form-button.module.scss';
import {ButtonProps} from "../../entities/form-button/form-button.interfaces";

export const FormButton: FC<ButtonProps> = props => {
    const cls = [
        classes.Button,
        classes[props.type]
    ];

    function authorize() {
        fetch('/insert', {
            method: 'POST', body: JSON.stringify({
                email: 'dashav1605@mail.ru', password: '12345'
            })
        })
            .then((res) => res.json())
            .then((res) => {console.log(res)})
    }

    return (
        <div className={classes.buttonWrapper}>
            <button type='submit' className={cls.join(' ')} onClick={authorize}>
                { props.text }
            </button>
        </div>
    );
}