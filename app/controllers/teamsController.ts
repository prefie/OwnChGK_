import {validationResult} from 'express-validator';
import {getCustomRepository} from 'typeorm';
import {TeamRepository} from '../db/repositories/teamRepository';
import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {generateAccessToken, secret} from '../jwtToken';
import {TeamDto} from "../dtos/teamDto";
import {BigGameDto} from "../dtos/bigGameDto";
import {Participant} from "../db/entities/Team";


export class TeamsController {
    public async getAll(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }

            const {withoutUser} = req.query;
            const teams = withoutUser ?
                await getCustomRepository(TeamRepository).findTeamsWithoutUser()
                : await getCustomRepository(TeamRepository).find();

            return res.status(200).json({
                teams: teams?.map(value => new TeamDto(value))
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getAllGames(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }

            const {teamName} = req.params;
            const team = await getCustomRepository(TeamRepository).findByName(teamName);
            return res.status(200).json({
                games: team.bigGames?.map(game => new BigGameDto(game))
            })

        } catch (error) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async insertTeam(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {teamName, captain, participants} = req.body;

            const mappedParticipants = participants?.map(value => new Participant(value.email, value.name)); // избавляемся от мусора в JSON
            await getCustomRepository(TeamRepository).insertTeam(teamName, captain, mappedParticipants);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async deleteTeam(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }

            const {teamId} = req.params;
            await getCustomRepository(TeamRepository).delete(teamId);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async editTeam(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }

            const {teamId} = req.params;
            const {newTeamName, captain, participants} = req.body;

            const mappedParticipants = participants?.map(value => new Participant(value.email, value.name)); // избавляемся от мусора в JSON
            await getCustomRepository(TeamRepository).updateByParams(teamId, newTeamName, captain, mappedParticipants);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async editTeamCaptainByCurrentUser(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }

            const {teamId} = req.params;
            const token = req.cookies['authorization'];
            const {id: userId} = jwt.verify(token, secret) as jwt.JwtPayload;
            await getCustomRepository(TeamRepository).updateEmptyTeamByIdAndUserEmail(teamId, userId);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async getTeam(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }

            const {teamId} = req.params;
            const team = await getCustomRepository(TeamRepository).findOne(teamId, {relations: ['captain']});
            if (!team) {
                return res.status(404).json({message: 'team not found'});
            }

            return res.status(200).json(new TeamDto(team));
        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }

    public async deleteTeamCaptainById(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }

            const {teamId} = req.params;
            const oldToken = req.cookies['authorization'];
            const {
                id: userId,
                email: email,
                roles: userRoles,
                name: name
            } = jwt.verify(oldToken, secret) as jwt.JwtPayload;
            const user = await getCustomRepository(UserRepository).findOne(+userId, {relations: ['team']})
            if (user.team.id === +teamId) {
                await getCustomRepository(TeamRepository).deleteTeamCaptainByIdAndUserEmail(teamId);
                const token = generateAccessToken(userId, email, userRoles, null, null, name);
                res.cookie('authorization', token, {
                    maxAge: 24 * 60 * 60 * 1000,
                    secure: true
                });
                return res.status(200).json({});
            }
            return res.status(403).json({message: "user not captain of this team"});

        } catch (error: any) {
            return res.status(500).json({
                message: error.message,
                error,
            });
        }
    }
}
}
