import type { Event, IEventEmitter } from '@testpilot/contracts';
/**
 * Simple event emitter implementation
 */
export declare class EventEmitter implements IEventEmitter {
    private handlers;
    emit(event: Event): void;
    on(type: string, handler: (event: Event) => void): void;
    off(type: string, handler: (event: Event) => void): void;
}
//# sourceMappingURL=event-emitter.d.ts.map