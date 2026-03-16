import axios from 'axios';

interface MatrixRoomResponse {
    room_id: string;
}

export class MatrixBridgeService {
    private static readonly HOMESERVER_URL = process.env.MATRIX_HOMESERVER_URL || 'https://matrix.vanguard.local';
    private static readonly ADMIN_TOKEN = process.env.MATRIX_ADMIN_TOKEN;

    /**
     * Creates an encrypted Matrix room for a clinical case.
     * @param caseId The UUID of the clinical case in Supabase.
     * @param counselorName Name of the primary counselor for the room alias.
     * @returns The room ID of the newly created Matrix room.
     */
    static async createClinicalRoom(caseId: string, counselorName: string): Promise<string> {
        if (!this.ADMIN_TOKEN) {
            console.warn('⚠️ Matrix ADMIN_TOKEN not set. Skipping room creation.');
            return 'pending_setup';
        }

        try {
            const response = await axios.post<MatrixRoomResponse>(
                `${this.HOMESERVER_URL}/_matrix/client/v3/createRoom`,
                {
                    name: `Clinical Case: ${caseId.substring(0, 8)}`,
                    topic: `Encrypted discussion channel for counselor ${counselorName}`,
                    visibility: 'private',
                    preset: 'private_chat',
                    initial_state: [
                        {
                            type: 'm.room.encryption',
                            state_key: '',
                            content: {
                                algorithm: 'm.megolm.v1.aes-sha2',
                            },
                        },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.ADMIN_TOKEN}`,
                    },
                }
            );

            console.log(`✅ Matrix room created for case ${caseId}: ${response.data.room_id}`);
            return response.data.room_id;
        } catch (error) {
            console.error('❌ Error creating Matrix room:', error);
            throw new Error('Failed to create clinical communication channel');
        }
    }

    /**
     * Invites a user to a clinical room.
     * @param roomId The Matrix room ID.
     * @param userId The Matrix user ID (e.g., @user:matrix.vanguard.local).
     */
    static async inviteUserToRoom(roomId: string, userId: string): Promise<void> {
        try {
            await axios.post(
                `${this.HOMESERVER_URL}/_matrix/client/v3/rooms/${roomId}/invite`,
                { user_id: userId },
                {
                    headers: {
                        Authorization: `Bearer ${this.ADMIN_TOKEN}`,
                    },
                }
            );
            console.log(`✅ User ${userId} invited to room ${roomId}`);
        } catch (error) {
            console.error(`❌ Error inviting user ${userId} to room ${roomId}:`, error);
        }
    }
}
