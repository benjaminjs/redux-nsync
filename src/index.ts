import { Store, AnyAction, MiddlewareAPI, Middleware } from "redux";

export interface SyncConnector {
  sendCurrentState(payload): void;
  sendAction(action: AnyAction): void;
  onConnection(): Promise<any>;
  isClient(): boolean;
  isHost(): boolean;
  onClientConnected(callback: () => void): void;
  onAction(callback: (action: AnyAction) => void): void;
}


export const Sync = (
  connection: SyncConnector
): Promise<{ stateSync: Middleware; state?: Store<any> }> => {
  const stateSync = (store: MiddlewareAPI<any>) => {
    connection.onClientConnected(() =>
      connection.sendCurrentState(store.getState())
    );

    connection.onAction(action => {
      if (connection.isClient()) action.__$syncAction = true;
      store.dispatch(action);
    });

    return next => (action: AnyAction) => {
      if (action.__$syncAction !== true) {
        connection.sendAction(action);
        if (connection.isClient()) return;
      } else if (connection.isHost()) {
        return;
      }

      return next(action);
    };
  };

  if (connection.isClient()) {
    return connection.onConnection().then(state => ({
      state,
      stateSync
    }));
  } else {
    return Promise.resolve({
      stateSync
    });
  }
};
