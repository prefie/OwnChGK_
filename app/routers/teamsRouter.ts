import {Router} from 'express';
import {TeamsController} from '../controllers/teamsController';
import {middleware} from '../middleware/middleware';
import {roleMiddleware} from '../middleware/roleMiddleware';
import {adminAccess} from "./mainRouter";
import {body, param, query} from "express-validator";

export const teamsRouter = () => {
    const router = Router();

    const teamsController = new TeamsController();

    router.get('/',
        middleware,
        query('withoutUser').optional().isBoolean(), teamsController.getAll.bind(teamsController));

    router.get('/:teamId',
        middleware,
        param('teamId').isUUID(), teamsController.getTeam.bind(teamsController));

    router.get('/:teamId/participants',
        middleware,
        param('teamId').isUUID(), teamsController.getParticipants.bind(teamsController));

    router.patch('/:teamId/change',
        middleware,
        param('teamId').isUUID(),
        body('newTeamName').isString().notEmpty(),
        body('captain').optional({nullable: true}).isEmail(),
        body('participants').optional({nullable: true}).isArray(),
        body('participants.*.email').optional().isString(), // TODO: потом добавить валидацию на мыло
        body('participants.*.name').optional().isString(), teamsController.editTeam.bind(teamsController)); // TODO: внутри есть проверка юзера, мб перенести в новый middleware

    router.patch('/:teamId/changeCaptain',
        middleware,
        param('teamId').isUUID(), teamsController.editTeamCaptainByCurrentUser.bind(teamsController));

    router.delete('/:teamId',
        roleMiddleware(adminAccess),
        param('teamId').isUUID(), teamsController.deleteTeam.bind(teamsController));
    
    router.patch('/:teamId/deleteCaptain',
        middleware,
        param('teamId').isUUID(), teamsController.deleteTeamCaptainById.bind(teamsController));

    router.post('/',
        middleware,
        body('teamName').isString().notEmpty(),
        body('captain').optional({nullable: true}).isEmail(),
        body('participants').optional({nullable: true}).isArray(),
        body('participants.*.email').optional().isString(), // TODO: потом добавить валидацию на мыло
        body('participants.*.name').optional().isString(), teamsController.insertTeam.bind(teamsController));

    return router;
}
