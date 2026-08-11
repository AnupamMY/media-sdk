type EventMap = object;
type Listener<T> = (payload: T) => void;

export class TypedEventEmitter<Events extends EventMap> {
  readonly #listeners = new Map<keyof Events, Set<Listener<Events[keyof Events]>>>();

  on<EventName extends keyof Events>(event: EventName, listener: Listener<Events[EventName]>): () => void {
    const listeners = this.#listeners.get(event) ?? new Set<Listener<Events[keyof Events]>>();
    listeners.add(listener as Listener<Events[keyof Events]>);
    this.#listeners.set(event, listeners);
    return () => this.off(event, listener);
  }

  off<EventName extends keyof Events>(event: EventName, listener: Listener<Events[EventName]>): void {
    this.#listeners.get(event)?.delete(listener as Listener<Events[keyof Events]>);
  }

  emit<EventName extends keyof Events>(event: EventName, payload: Events[EventName]): void {
    for (const listener of [...(this.#listeners.get(event) ?? [])]) {
      listener(payload);
    }
  }
}
