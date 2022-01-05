import {EntityRepository, In, Repository} from 'typeorm';
import {Game} from '../entities/Game';
import {Team} from '../entities/Team';
import {Admin} from '../entities/Admin';
import {Round} from '../entities/Round';

@EntityRepository(Game)
export class GameRepository extends Repository<Game> {
    findByName(name: string) {
        return this.findOne({name}, {relations: ['teams', 'rounds']});
    }

    findAmIParticipate(userId: number) {
        return this.createQueryBuilder("games")
            .leftJoinAndSelect("games.teams", "teams")
            .leftJoinAndSelect("teams.captain", "users")
            .where('teams.captain.id = :id', {id: userId})
            .getMany().then(ans => {
                console.log(ans);
                return ans;
            })
        /*return this.manager.transaction(manager => manager.findOne(User, userId)
            .then(user => {
                return manager.findOne(Team, {captain: user}, {relations: ['captain']})
            })
                .then(team => {
                    console.log(team);
                    return manager.find(Game, {relations: ['teams']})
                        .then(games => games.filter(game => {
                            console.log(game);
                            let res = game.teams.some(t => t.id === team.id);
                        console.log(res);
                        return res;}))}));*/
    }

    insertByParams(name: string,
                   adminEmail: string,
                   roundCount: number,
                   questionCount: number,
                   questionCost: number,
                   questionTime: number,
                   teams: string[]) {
        return this.manager.transaction(manager => manager.findOne(Admin, {'email': adminEmail})
            .then(admin => manager.find(Team, {'name': In(teams)})
                .then(teams => manager.create(Game, {name, admin, teams}).save())
                .then(game => {
                    for (let i = 1; i <= roundCount; i++) {
                        manager.insert(Round, {number: i, game, questionCount, questionCost, questionTime});
                    }
                })));
    }

    updateByParams(gameId: string,
                   newName: string,
                   roundCount: number,
                   questionCount: number,
                   questionCost: number,
                   questionTime: number,
                   teams: string[]) {
        return this.manager.transaction(manager => manager.find(Team, {'name': In(teams)})
            .then(teams => manager.findOne(Game, gameId)
                .then(game => {
                    game.teams = teams;
                    game.name = newName;
                    return manager.save(Game, game);
                })
                .then(game => {
                    manager.delete(Round, {game}).then(() => {
                        for (let i = 1; i <= roundCount; i++) {
                            manager.insert(Round, {number: i, game, questionCount, questionCost, questionTime});
                        }
                    })
                })));
    }

    deleteByName(name: string) {
        return this.delete({name});
    }

    updateByNames(name: string, newName: string) {
        return this.update({name}, {'name': newName});
    }

    updateByNameAndAdminEmail(name: string, newAdminEmail: string) {
        return this.manager.transaction(manager => {
            return manager.findOne(Admin, {'email': newAdminEmail})
                .then(admin => manager.update(Game, {name}, {'admin': admin}));
        });
    }

    updateByGameIdAndStatus(gameId: string, newStatus: string) {
        return this.update(gameId, {'status': newStatus});
    }
}
