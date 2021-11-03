import React, {FC} from 'react';
import Wrapper from './wrapper';
import Authorization from './pages/authorization/authorization';
import Registration from './pages/registration/registration';
import {Redirect, Route, Switch} from 'react-router-dom';
import AdminStartScreen from "./pages/admin-start-screen/admin-start-screen";
import GameCreator from "./pages/game-creation/game-creation";
import TeamCreator from "./pages/team-creation/team-creation";
import UserStartScreen from "./pages/user-start-screen/user-start-screen";

const App: FC = () => {
    return (
        <Wrapper>
            <Switch>
                <Route path={['/', '/auth']} component={Authorization} exact={true} />
                <Route path={'/admin'} exact={true} >
                    <Authorization isAdmin={true} />
                </Route>
                <Route path="/registration" component={Registration} exact={true} />
                <Route path="/admin/start-screen" component={AdminStartScreen} exact={true} />
                <Route path="/start-screen" component={UserStartScreen} />
                <Route path="/game-creation" exact={true}>
                    <GameCreator mode="creation" />
                </Route>
                <Route path="/game-creation/edit" >
                    <GameCreator mode="edit" />
                </Route>
                <Route path="/team-creation" exact={true}>
                    <TeamCreator mode="creation" />
                </Route>
                <Route path="/team-creation/edit">
                    <TeamCreator mode="edit" />
                </Route>
                <Redirect from='*' to='/'/>
            </Switch>
        </Wrapper>
    );
}

export default App;
