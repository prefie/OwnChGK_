import React, {FC, useEffect, useState} from 'react';
import classes from './answers.module.scss';
import PageWrapper from "../../components/page-wrapper/page-wrapper";
import Header from "../../components/header/header";
import {Link, useParams} from 'react-router-dom';
import CustomCheckbox from "../../components/custom-checkbox/custom-checkbox";
import {Scrollbars} from "rc-scrollbars";
import _ from "lodash";
import {AnswerType, Opposition, Page} from "../../entities/answers-page/answers-page.interfaces";

const AnswersPage: FC = () => {
    const { tour, question } = useParams<{tour: string, question: string}>();
    const [page, setPage] = useState<Page>('answers');
    const [answersType, setAnswersType] = useState<AnswerType>('accepted');
    const [gameAnswers, setGameAnswers] = useState<string[]>(['Котик', 'Котейка', 'Котик', 'Котик', 'Котик', 'Котик', 'Котик', 'Котёнок', 'mememe']); // TODO сюда наверное они откуда то поступают, потом нужно будет синхронозироват с uncheckedAnswers, если сюда чето новое попало, чтобы туда тоже попадало
    const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>([]);
    const [uncheckedAnswers, setUncheckedAnswers] = useState<string[]>(['Котик', 'Котейка', 'Котик', 'Котик', 'Котик', 'Котик', 'Котик', 'Котёнок', 'mememe']);
    const [rejectedAnswers, setRejectedAnswers] = useState<string[]>([]);
    const [currentHandledAnswers, setCurrentHandledAnswers] = useState<string[]>([]);
    const [oppositions, setOppositions] = useState<Opposition[]>([{teamName: 'Сахара опять не будет', answer: 'Ответ', explanation: 'Пояснение'},
        {teamName: 'Забаненные в гугле', answer: 'Ответ', explanation: 'Пояснение'},
        {teamName: 'Не грози Южному автовокзалу', answer: 'Ответ', explanation: 'Пояснение'},
        {teamName: 'ГУ ЧГК-шки-ниндзя', answer: 'Ответ', explanation: 'Пояснение'}]); // TODO тут как то получаем апелляции через сокеты или хз как, они наверное как то должны быть синхронизированы с вопросами

    useEffect(() => {
        function handleWindowResize() {
            const indicator = document.querySelector('#indicator') as HTMLSpanElement;
            const element = document.querySelector(`.${classes['is-active']}`) as HTMLElement;
            if (element) {
                indicator.style.width = `${element.offsetWidth}px`;
                indicator.style.left = `${element.offsetLeft}px`;
                indicator.style.backgroundColor = "white";
            }
        }

        const indicator = document.querySelector('#indicator') as HTMLSpanElement;
        const activeItem = document.querySelector(`.${classes['is-active']}`) as HTMLElement;

        indicator.style.width = `${activeItem.offsetWidth}px`;
        indicator.style.left = `${activeItem.offsetLeft}px`;
        indicator.style.backgroundColor = "white";

        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        }
    }, []);

    const handleCheckboxChange = (event: React.SyntheticEvent) => {
        const element = event.target as HTMLInputElement;
        setCurrentHandledAnswers(prev => [...prev, element.name]);
    };

    const handleIndicator = (event: React.SyntheticEvent) => {
        const indicator = document.querySelector('#indicator') as HTMLSpanElement;
        const items = document.querySelectorAll(`.${classes['nav-item']}`);
        const el = event.target as HTMLElement;

        items.forEach(function (item) {
            item.classList.remove(classes['is-active']);
            item.removeAttribute('style');
        });

        indicator.style.width = `${el.offsetWidth}px`;
        indicator.style.left = `${el.offsetLeft}px`;
        indicator.style.backgroundColor = "white";

        el.classList.add(classes['is-active']);
    };

    const changePageToAnswers = (event: React.SyntheticEvent) => {
        handleIndicator(event);
        setPage('answers');
    };

    const changePageToOppositions = (event: React.SyntheticEvent) => {
        handleIndicator(event);
        setPage('oppositions');
    };

    const getAnswers = (answers: string[], checked: boolean) => {
        const counterAnswers = _.countBy(gameAnswers);
        const answersForRender = Object.entries(counterAnswers).filter(el => answers.includes(el[0]));
        return answersForRender.map(([answer, count]: [string, number]) => {
            return (
                <div className={classes.answerWrapper} key={`${answersType}_${answer}`}>
                    <CustomCheckbox name={answer} checked={checked} onChange={handleCheckboxChange} style={{marginLeft: 0, marginBottom: 0, height: '6vh'}}/>
                    <div className={classes.answerCountWrapper}>{count}</div>
                </div>
            );
        });
    };

    const renderAnswers = () => {
        switch (answersType) {
            case 'accepted':
                return getAnswers(acceptedAnswers, true);
            case 'unchecked':
                return getAnswers(uncheckedAnswers, false);
            case 'rejected':
                return getAnswers(rejectedAnswers, false);
        }
    };

    const handleAnswerTypeChange = (event: React.SyntheticEvent) => {
        const clickedAnswerTypeElement = event.target as HTMLDivElement;
        setAnswersType(clickedAnswerTypeElement.id as AnswerType);
    };

    const handleSaveButtonClick = () => {
        switch (answersType) {
            case "accepted":
                setRejectedAnswers(prev => [...prev, ...currentHandledAnswers]);
                setAcceptedAnswers(prev => prev.filter(el => !currentHandledAnswers.includes(el)));
                break;
            case "unchecked":
                setAcceptedAnswers(prev => [...prev, ...currentHandledAnswers]);
                setRejectedAnswers(prev => [...prev, ...uncheckedAnswers.filter(el => !currentHandledAnswers.includes(el))]);
                setUncheckedAnswers([]);
                break;
            case "rejected":
                setAcceptedAnswers(prev => [...prev, ...currentHandledAnswers]);
                setRejectedAnswers(prev => prev.filter(el => !currentHandledAnswers.includes(el)));
                break;
        }
        setCurrentHandledAnswers([]);
    };

    const renderOppositions = () => {
        return oppositions.map(op => {
            return (
                <div className={classes.oppositionWrapper} key={op.teamName}>
                    <p className={classes.teamName}>{op.teamName}</p>
                    <CustomCheckbox name={op.answer} style={{ marginLeft: 0, marginBottom: 0, width: '100%' }} />
                    <div className={classes.explanation}>
                        <Scrollbars autoHide autoHideTimeout={500}
                                    autoHideDuration={200}
                                    renderThumbVertical={() => <div style={{backgroundColor: 'transparent'}}/>}
                                    renderTrackVertical={() => <div style={{backgroundColor: 'transparent'}}/>}
                                    classes={{view: classes.scrollbarView}}>
                            {op.explanation}
                        </Scrollbars>
                    </div>
                </div>
            );
        });
    };

    const handleSaveOppositionButtonClick = () => {
        setOppositions([]);
    }

    const renderPage = () => {
        switch (page) {
            case 'answers':
                return (
                    <div className={classes.sectionWrapper}>
                        <div className={classes.answersPageWrapper}>
                            <div className={classes.answerTypesWrapper}>
                                <div className={`${classes.answerType} ${answersType === 'accepted' ? classes.activeAnswerType : ''}`} id='accepted' onClick={handleAnswerTypeChange}>принятые</div>
                                <div className={`${classes.answerType} ${answersType === 'unchecked' ? classes.activeAnswerType : ''}`} id='unchecked' onClick={handleAnswerTypeChange}>непроверенные</div>
                                <div className={`${classes.answerType} ${answersType === 'rejected' ? classes.activeAnswerType : ''}`} id='rejected' onClick={handleAnswerTypeChange}>отклоненные</div>
                            </div>

                            <div className={classes.answersWrapper}>
                                <Scrollbars className={classes.scrollbar} autoHide autoHideTimeout={500}
                                            autoHideDuration={200}
                                            renderThumbVertical={() => <div style={{backgroundColor: 'transparent'}}/>}
                                            renderTrackVertical={() => <div style={{backgroundColor: 'transparent'}}/>}
                                            classes={{view: classes.scrollbarView}}>
                                    {renderAnswers()}
                                </Scrollbars>
                            </div>

                            <div className={classes.saveButtonWrapper}>
                                <button className={classes.saveButton} onClick={handleSaveButtonClick}>Сохранить</button>
                            </div>
                        </div>
                    </div>
                );
            case 'oppositions':
                return (
                    <div className={classes.oppositionsPageWrapper}>
                        <div className={classes.oppositionsWrapper}>
                            <Scrollbars className={classes.scrollbar} autoHide autoHideTimeout={500}
                                        autoHideDuration={200}
                                        renderThumbVertical={() => <div style={{backgroundColor: 'transparent'}}/>}
                                        renderTrackVertical={() => <div style={{backgroundColor: 'transparent'}}/>}
                                        classes={{view: classes.oppositionsScrollbarView}}>
                                {renderOppositions()}
                            </Scrollbars>
                        </div>

                        <div className={classes.saveOppositionButtonWrapper}>
                            <button className={classes.saveButton} onClick={handleSaveOppositionButtonClick}>Сохранить</button>
                        </div>
                    </div>
                );
        }
    }

    return (
        <PageWrapper>
            <Header isAuthorized={true} isAdmin={true}>
                <Link to='/admin/game' className={classes.toGameLink}>В игру</Link>

                <div className={classes.tourNumber}>Тур {tour}</div>
                <div className={classes.questionNumber}>Вопрос {question}</div>

                <nav className={classes.nav}>
                    <Link to={{}} className={`${classes['nav-item']} ${page === 'answers' ? classes['is-active'] : null}`} onClick={changePageToAnswers}>Ответы</Link>
                    <Link to={{}} className={`${classes['nav-item']} ${page === 'oppositions' ? classes['is-active'] : null}`} onClick={changePageToOppositions}>
                        Апелляции {oppositions.length !== 0 ? <b className={classes.opposition}>&#9679;</b> : ''}
                    </Link>
                    <span className={`${classes['nav-indicator']}`} id='indicator'/>
                </nav>
            </Header>

            {renderPage()}
        </PageWrapper>
    );
}

export default AnswersPage;

