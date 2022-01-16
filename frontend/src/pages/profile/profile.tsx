import React, {FC, useState} from 'react';
import classes from './profile.module.scss';
import PageWrapper from '../../components/page-wrapper/page-wrapper';
import {ProfileProps} from '../../entities/profile/profile.interfaces';
import Header from '../../components/header/header';
import {CustomInput} from '../../components/custom-input/custom-input';
import {Alert, Snackbar} from '@mui/material';
import {store} from '../../index';
import {changeName, changePassword} from '../../server-api/server-api';
import PageBackdrop from '../../components/backdrop/backdrop';

const Profile: FC<ProfileProps> = props => {
    const [userName, setUserName] = useState<string>(store.getState().appReducer.user.name);
    const [userPassword, setUserPassword] = useState<string>('');
    const [userOldPassword, setUserOldPassword] = useState<string>('');
    const [repeatedPassword, setRepeatedPassword] = useState<string>('');
    const [isRepeatedPasswordInvalid, setIsRepeatedPasswordInvalid] = useState<boolean>(false);
    const [isOldPasswordInvalid, setIsOldPasswordInvalid] = useState<boolean>(false);
    const [flags, setFlags] = useState<{isSuccess: boolean, isSnackbarOpen: boolean, isLoading: boolean}>({isSuccess: true, isSnackbarOpen: false, isLoading: false});
    const userTeam = store.getState().appReducer.user.team;
    const userEmail = store.getState().appReducer.user.email;

    const checkRepeatedPassword = () => {
        if (userPassword !== repeatedPassword) {
            setIsRepeatedPasswordInvalid(true);
            return false;
        } else {
            setIsRepeatedPasswordInvalid(false);
            return true;
        }
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setFlags({isSuccess: flags.isSuccess, isSnackbarOpen: false, isLoading: false});
    };

    const clearAfterSave = () => {
        setIsOldPasswordInvalid(false);
        setUserOldPassword('');
        setUserPassword('');
        setRepeatedPassword('');
    }

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setIsOldPasswordInvalid(false);

        setFlags({isSuccess: true, isSnackbarOpen: false, isLoading: true});
        if (userPassword === '') {
            changeName(userName, props.isAdmin)
                .then(res => {
                    if (res.status === 200) {
                        setFlags({isSuccess: true, isSnackbarOpen: true, isLoading: false});
                    } else {
                        setFlags({isSuccess: false, isSnackbarOpen: true, isLoading: false});
                    }
                });

            clearAfterSave();
            return false;
        } else if (userOldPassword === '') {
            setIsOldPasswordInvalid(true);
            return false;
        } else {
            if (checkRepeatedPassword()) {
                changePassword(userEmail, userPassword, userOldPassword, props.isAdmin)
                    .then(res => {
                        if (res.status === 200) {
                            setFlags({isSuccess: true, isSnackbarOpen: false, isLoading: true});
                            return 'success';
                        } else if (res.status === 403) {
                            setIsOldPasswordInvalid(true);
                            return 'old password invalid';
                        } else {
                            setFlags({isSuccess: false, isSnackbarOpen: false, isLoading: true});
                            return 'something went wrong';
                        }
                    }).then((res) => {
                        if (res === 'old password invalid') {
                            setFlags({isSuccess: false, isSnackbarOpen: false, isLoading: false});
                        } else if (res === 'success') {
                            changeName(userName, props.isAdmin)
                                .then(res => {
                                    if (res.status === 200) {
                                        return 'success';
                                    } else {
                                        return 'fail';
                                    }
                                }).then((res) => {
                                    if (res === 'success') {
                                        setFlags({isSuccess: true, isSnackbarOpen: true, isLoading: false});
                                    } else {
                                        setFlags({isSuccess: false, isSnackbarOpen: true, isLoading: false});
                                    }
                                    clearAfterSave();
                                });
                        } else {
                            setFlags({isSuccess: false, isSnackbarOpen: true, isLoading: false});
                            clearAfterSave();
                        }
                    });
            } else {
                setFlags({isSuccess: false, isSnackbarOpen: false, isLoading: false});
            }
        }
    };

    const handleUserOldPassportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserOldPassword(event.target.value);
    };

    const handleUserPassportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserPassword(event.target.value);
    };

    const handleRepeatedPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRepeatedPassword(event.target.value);
    };

    const handleUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(event.target.value);
    };

    console.log(flags.isSnackbarOpen);

    return (
            <PageWrapper>
                <Header isAuthorized={true} isAdmin={props.isAdmin}>
                    <div className={classes.pageTitle}>Профиль</div>
                </Header>

                <form className={classes.box} onSubmit={handleSubmit} autoComplete='off'>
                    <div className={classes.contentWrapper}>
                        <div className={classes.infoWrapper}>
                            <CustomInput type="text" id="name" name="name" placeholder="Имя" defaultValue={userName}
                                         required={false} style={{marginTop: 'calc(2vw + 2vh)'}} value={userName}
                                         onChange={handleUserNameChange}/>

                            {
                                !props.isAdmin
                                    ?
                                    <div className={classes.infoCategoryWrapper}>
                                        <p className={classes.category}>Команда</p>
                                        <p className={classes.userData}>{userTeam}</p>
                                    </div>
                                    : null
                            }

                            <div className={classes.infoCategoryWrapper} style={{marginTop: '3vh'}}>
                                <p className={classes.category}>Почта</p>
                                <p className={classes.userData}>{userEmail}</p>
                            </div>
                        </div>

                        <div className={classes.changePasswordWrapper}>
                            <p className={classes.changePasswordParagraph}>Изменение пароля</p>

                            <CustomInput type="password" id="old-password" name="old-password"
                                         placeholder="Введите старый пароль" style={{marginBottom: '3.5vh'}}
                                         isInvalid={isOldPasswordInvalid} required={false} value={userOldPassword}
                                         onChange={handleUserOldPassportChange}/>
                            <CustomInput type="password" id="new-password" name="new-password"
                                         placeholder="Введите новый пароль" isInvalid={isRepeatedPasswordInvalid}
                                         required={false} value={userPassword}
                                         onChange={handleUserPassportChange}/>
                            <CustomInput type="password" id="repeat-new-password" name="repeat-new-password"
                                         placeholder="Повторите новый пароль" isInvalid={isRepeatedPasswordInvalid}
                                         value={repeatedPassword} onChange={handleRepeatedPasswordChange}
                                         onBlur={checkRepeatedPassword} required={false}/>

                            {isOldPasswordInvalid ? <Alert severity="error" sx={{
                                color: 'white',
                                backgroundColor: '#F44336',
                                marginTop: '1vh',
                                '& .MuiAlert-icon': {
                                    color: 'white'
                                }
                            }}>Неверный старый пароль</Alert> : null}

                            {isRepeatedPasswordInvalid ? <Alert severity="error" sx={{
                                color: 'white',
                                backgroundColor: '#F44336',
                                marginTop: '1vh',
                                '& .MuiAlert-icon': {
                                    color: 'white'
                                }
                            }}>Пароли не совпадают</Alert> : null}
                        </div>
                    </div>

                    <div className={classes.buttonWrapper}>
                        <button className={classes.saveButton} type="submit">Сохранить</button>
                    </div>
                </form>
                <Snackbar open={flags.isSnackbarOpen} autoHideDuration={5000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity={flags.isSuccess ? 'success' : 'error'} sx={{width: '100%'}}>
                        {flags.isSuccess ? 'Изменения успешно сохранены' : 'Не удалось сохранить изменения'}
                    </Alert>
                </Snackbar>
                <PageBackdrop isOpen={flags.isLoading} />
            </PageWrapper>
        );
};

export default Profile;