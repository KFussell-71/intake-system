export interface DomainEvent {
    type: string;
    payload: any;
    occurredAt: number;
}

type EventHandler = (event: DomainEvent) => Promise<void> | void;

export class DomainEventBus {
    private static handlers: Map<string, EventHandler[]> = new Map();

    static subscribe(eventType: string, handler: EventHandler) {
        const current = this.handlers.get(eventType) || [];
        this.handlers.set(eventType, [...current, handler]);
    }

    static async publish(event: DomainEvent) {
        const handlers = this.handlers.get(event.type) || [];
        console.log(`[DomainEventBus] Publishing ${event.type}`, event.payload);

        // Execute all handlers in parallel
        await Promise.all(handlers.map(handler => {
            try {
                return handler(event);
            } catch (err) {
                console.error(`[DomainEventBus] Error in handler for ${event.type}:`, err);
            }
        }));
    }
}
