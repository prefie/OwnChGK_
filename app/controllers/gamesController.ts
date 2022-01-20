import {validationResult} from 'express-validator';
import {getCustomRepository} from 'typeorm';
import {GameRepository} from '../db/repositories/gameRepository';
import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {secret} from '../jwtToken';
import {gameAdmins, games, gameUsers} from '../socket';
import {Game, Round} from '../logic/Game';
import {Team} from '../logic/Team';
import {GameDTO} from '../dto';

export class GamesController {
    public async getAll(req: Request, res: Response) {
        try {
            const {amIParticipate} = req.query;
            let games: any;
            if (amIParticipate) {
                const oldToken = req.cookies['authorization'];
                const {id: userId} = jwt.verify(oldToken, secret) as jwt.JwtPayload;
                console.log(userId);
                if (!userId) {
                    console.log('true');
                    return res.status(400).json({message: 'userId is undefined'});
                }
                games = await getCustomRepository(GameRepository).findAmIParticipate(userId); // TODO: ломается?
            } else {
                games = await getCustomRepository(GameRepository).find();
            }
            //games = await getCustomRepository(GameRepository).find();
            return res.status(200).json({
                'games': games.map(value => new GameDTO(value))
            });
        } catch (error) {
            return res.status(400).json({message: error.message});
        }
    }

    public async getAllTeams(req: Request, res: Response) {
        try {
            const {gameName} = req.params;
            const game = await getCustomRepository(GameRepository).findByName(gameName);
            if (!game) {
                return res.status(404).json({message: 'game not found'});
            }
            return res.status(200).json(game.teams.map(team => team.name));
        } catch (error) {
            return res.status(400).json({message: 'Error'}).send(error);
        }
    }

    public async insertGame(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameName, roundCount, questionCount, teams} = req.body;
            if (!gameName
                || !roundCount
                || !questionCount
                || !teams
                || roundCount < 0
                || questionCount < 0) {
                return res.status(400).json({message: 'params is invalid'});
            }

            const token = req.cookies['authorization'];
            const payLoad = jwt.verify(token, secret);
            if (typeof payLoad !== 'string') {
                await getCustomRepository(GameRepository).insertByParams(
                    gameName, payLoad.email, roundCount, questionCount, 1, 60, teams);
                return res.status(200).json({});
            } else {
                res.send('You are not admin');
            }
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async deleteGame(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            if (!gameId) {
                return res.status(400).json({message: 'gameId is invalid'});
            }

            await getCustomRepository(GameRepository).delete(gameId);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async editGameName(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            const {newGameName} = req.body;
            await getCustomRepository(GameRepository).updateById(gameId, newGameName);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async editGameAdmin(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            const {admin} = req.body;
            await getCustomRepository(GameRepository).updateByIdAndAdminEmail(gameId, admin);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async getGame(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            const game = await getCustomRepository(GameRepository).findOne(gameId, {relations: ['teams', 'rounds']});
            if (!game) {
                return res.status(404).json({message: 'game not found'});
            }
            const answer = {
                name: game.name,
                isStarted: !!games[gameId],
                id: game.id,
                teams: game.teams.map(value => value.name),
                roundCount: game.rounds.length,
                questionCount: game.rounds.length !== 0 ? game.rounds[0].questionCount : 0
            };
            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async startGame(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            const game = await getCustomRepository(GameRepository).findOne(+gameId, {relations: ['teams', 'rounds']});
            if (!game) {
                return res.status(404).json({message: 'game not found'});
            }
            const answer = {
                name: game.name,
                teams: game.teams.map(value => value.name),
                roundCount: game.rounds.length,
                questionCount: game.rounds.length !== 0 ? game.rounds[0].questionCount : 0
            };
            gameAdmins[game.id] = new Set();
            gameUsers[game.id] = new Set();
            games[game.id] = new Game(game.name);
            setTimeout(() => {
                delete games[gameId];
                delete gameUsers[gameId];
                delete gameAdmins[gameId];
                console.log('all: ', gameAdmins, gameUsers, games);
            }, 1000 * 60 * 60 * 24 * 3);
            for (let i = 0; i < game.rounds.length; i++) {
                games[game.id].addRound(new Round(i + 1, answer.questionCount, 60, 1));
            }
            for (const team of game.teams) {
                games[game.id].addTeam(new Team(team.name, team.id));
            }
            await getCustomRepository(GameRepository).updateByGameIdAndStatus(gameId, 'started');
            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async changeGame(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            if (!gameId) {
                return res.status(400).json({message: 'gameId is invalid'});
            }
            const {newGameName, roundCount, questionCount, teams} = req.body;
            if (!newGameName
                || !roundCount
                || !questionCount
                || !teams) {
                return res.status(400).json({message: 'params is invalid'});
            }

            const token = req.cookies['authorization'];
            const payLoad = jwt.verify(token, secret);
            const game = await getCustomRepository(GameRepository).findOne(gameId);
            if (!game) {
                return res.status(404).json({message: 'game not found'});
            }
            if (typeof payLoad !== 'string') {
                console.log('ChangeGame:', teams);
                await getCustomRepository(GameRepository).updateByParams(
                    gameId, newGameName, roundCount, questionCount, 1, 60, teams
                );
                return res.status(200).json({});
            } else {
                return res.status(403).json({message:'You are not admin'});
            }
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async changeIntrigueStatus(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            const {isIntrigue} = req.body;

            if (!games[gameId]) {
                return res.status(404).json({'message': 'Игра не началась'});
            }

            games[gameId].isIntrigue = isIntrigue;
            isIntrigue ? console.log('intrigue started') : console.log('intrigue finished');
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async getGameResult(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            if (!games[gameId]) {
                return res.status(404).json({'message': 'Игра не началась'});
            }
            const totalScore = games[gameId].getTotalScoreForAllTeams();
            const answer = {
                totalScoreForAllTeams: totalScore,
            };
            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async getGameResultScoreTable(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            if (!games[gameId]) {
                return res.status(404).json({'message': 'Игра не началась'});
            }

            const token = req.cookies['authorization'];
            const {roles, teamId} = jwt.verify(token, secret) as jwt.JwtPayload;

            if (roles === 'user' && !teamId) {
                return res.status(400).json({message: 'user without team'});
            }

            const answer = {
                gameId,
                isIntrigue: games[gameId].isIntrigue,
                roundsCount: games[gameId].rounds.length,
                questionsCount: games[gameId].rounds[0].questionsCount,
                totalScoreForAllTeams: roles === 'user' && teamId && games[gameId].isIntrigue ?
                    games[gameId].getScoreTableForTeam(teamId) : games[gameId].getScoreTable(),
            };

            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async getResultWithFormat(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }
            const {gameId} = req.params;
            if (!games[gameId]) {
                return res.status(404).json({'message': 'Игра не началась'});
            }

            const token = req.cookies['authorization'];
            const {roles, teamId} = jwt.verify(token, secret) as jwt.JwtPayload;

            if (roles === 'user' && !teamId) {
                return res.status(400).json({message: 'user without team'});
            }

            const headersList = ['Название команды', 'Сумма'];
            for (let i = 1; i <= games[gameId].rounds.length; i++) {
                headersList.push('Тур ' + i);
                for (let j = 1; j <= games[gameId].rounds[i - 1].questionsCount; j++) {
                    headersList.push('Вопрос ' + j);
                }
            }
            const teamRows = [];
            const totalScoreForAllTeams = games[gameId].getTotalScoreForAllTeams();
            const scoreTable = roles === 'user' && teamId && games[gameId].isIntrigue ?
                    games[gameId].getScoreTableForTeam(teamId) : games[gameId].getScoreTable();
            let roundsResultList = [];
            for (const team in scoreTable) {
                let roundSum = 0;
                for (let i = 0; i < games[gameId].rounds.length; i++) {
                    for (let j = 0; j < games[gameId].rounds[i].questionsCount; j++) {
                        roundSum += scoreTable[team][i][j];
                    }
                    roundsResultList.push(roundSum);
                    roundsResultList.push(scoreTable[team][i].join(';'));
                    roundSum = 0;
                }
                teamRows.push(team + ';' + totalScoreForAllTeams[team] + ';' + roundsResultList.join(';'));
                roundsResultList = [];
            }

            const headers = headersList.join(';');
            const value = teamRows.join('\n');
            const answer = {
                totalTable: headers + '\n' + value,
            };
            console.log(answer.totalTable);
            return res.status(200).json(answer);
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }

    public async changeGameStatus(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Ошибка', errors})
            }

            const {gameId} = req.params;
            const {status} = req.body;
            await getCustomRepository(GameRepository).updateByGameIdAndStatus(gameId, status);
            return res.status(200).json({});
        } catch (error: any) {
            return res.status(400).json({'message': error.message});
        }
    }
}