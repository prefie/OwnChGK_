import { Participant, Team } from '../entities/team';
import { User } from '../entities/user';
import { AppDataSource } from '../../utils/data-source';
import { BaseRepository } from './base.repository';
import { IsNull } from 'typeorm';

export class TeamRepository extends BaseRepository<Team> {
    constructor() {
        super(AppDataSource.getRepository(Team));
    }

    findWithCaptainRelations() {
        return this.innerRepository.find({
            relations: { captain: true }
        });
    }

    findByCaptainEmail(email: string) {
        return this.innerRepository.findOne({
            where: { captain: { email: email.toLowerCase() } },
            relations: { captain: true }
        });
    }

    findByName(name: string) {
        return this.innerRepository.findOne({
            where: { name },
            relations: { captain: true }
        });
    }

    findByIdWithRelations(id: string) {
        return this.innerRepository.findOne({
            where: { id },
            relations: { captain: true, bigGames: true }
        });
    }

    findTeamsWithoutUser() {
        return this.innerRepository.find({
            where: { captain: { id: IsNull() } },
            relations: { captain: true }
        });
    }

    async insertTeam(name: string, userEmail: string, participants: Participant[]) {
        const captain = userEmail
            ? await this.innerRepository.manager
                .findOneBy<User>(User, { email: userEmail.toLowerCase() })
            : null;
        const team = new Team();
        team.name = name;
        team.captain = captain;
        team.participants = participants;

        return this.innerRepository.save(team);
    }

    deleteByName(name: string) {
        return this.innerRepository.delete({ name });
    }

    async updateByParams(
        teamId: string,
        newName: string,
        captainEmail: string,
        participants: Participant[]
    ) {
        const team = await this.innerRepository.findOneBy({ id: teamId });
        if (!team) throw new Error('Нет команды');

        const captain = captainEmail
            ? await this.innerRepository.manager
                .findOneBy<User>(User, { email: captainEmail.toLowerCase() })
            : null;
        team.name = newName;
        team.captain = captain;
        team.participants = participants;

        return this.innerRepository.save(team);
    }

    async updateEmptyTeamByIdAndUserId(teamId: string, userId: string) {
        const team = await this.innerRepository.findOne({
            where: { id: teamId },
            relations: { captain: true }
        });
        if (!team || team.captain != null) {
            throw new Error('Команды нет или команда уже с капитаном');
        }

        const user = await this.innerRepository.manager.findOneBy<User>(User, { id: userId });
        if (!user) throw new Error('Нет такого юзера');
        team.captain = user;
        return this.innerRepository.save(team);
    }
}
