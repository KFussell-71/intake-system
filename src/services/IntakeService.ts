import { clientRepository, ClientRepository } from '../repositories/ClientRepository';

export class IntakeService {
    constructor(private readonly repo: ClientRepository = clientRepository) { }

    async submitNewIntake(data: any) {
        // Business logic: Any transformations or validation before saving
        return await this.repo.createClientWithIntakeRPC(data);
    }
}

export const intakeService = new IntakeService();
