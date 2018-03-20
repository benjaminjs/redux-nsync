import configureStore, { MockStore } from "redux-mock-store";
import { Sync, SyncConnector } from "../src";

const mockConnector = {
  onAction: jest.fn(),
  onConnection: jest.fn(),
  isClient: jest.fn(),
  isHost: jest.fn(),
  onClientConnected: jest.fn(),
  broadcast: jest.fn()
};

describe("Connection is a Client", () => {
  const action = {
    type: "SWAG",
    payload: "CITY"
  };
  const initState = {
    swag: "city"
  };

  let store: MockStore<any>, connectedSync;

  beforeEach(async done => {
    mockConnector.isClient.mockReturnValue(true);
    mockConnector.isHost.mockReturnValue(false);
    mockConnector.onAction.mockImplementationOnce(cb => cb(action));
    mockConnector.onConnection.mockReturnValue(
      Promise.resolve({ state: initState })
    );

    connectedSync = Sync(<SyncConnector>mockConnector);

    return connectedSync.then(({ stateSync, state }) => {
      const mockStore = configureStore([stateSync]);
      store = mockStore(state);
      done();
    });
  });

  afterEach(() => {
    store.clearActions();
    mockConnector.broadcast.mockClear();
  });

  test("Received events get piped in", () => {
    expect(store.getActions()[0]).toMatchObject(action);
  });

  test("Local actions get broadcast", () => {
    const testAction = {
      type: "swag"
    };

    store.dispatch(testAction);

    expect(mockConnector.broadcast.mock.calls[0][1]).toMatchObject(testAction);
  });

  test("Local actions don't passed through", () => {
    const testAction = {
      type: "swag"
    };

    store.dispatch(testAction);

    expect(store.getActions()[0]).not.toMatchObject(testAction);
  });

  test("Remote actions get passed through", () => {
    const testAction = {
      type: "swag",
      __$syncAction: true
    };

    store.dispatch(testAction);

    expect(store.getActions()[1]).toMatchObject(testAction);
  });
});

describe("Connection is a Host", () => {
  const action = {
    type: "SWAG",
    payload: "CITY"
  };
  const initState = {
    swag: "city"
  };
  let store: MockStore<any>, connectedSync;
  beforeEach(async done => {
    mockConnector.isClient.mockReturnValue(false);
    mockConnector.isHost.mockReturnValue(true);
    mockConnector.onAction.mockImplementationOnce(cb => cb(action));
    mockConnector.onClientConnected.mockImplementationOnce(cb => cb(action));
    mockConnector.onConnection.mockReturnValue(Promise.resolve({}));
    connectedSync = Sync(<SyncConnector>mockConnector);
    return connectedSync.then(({ stateSync }) => {
      const mockStore = configureStore([stateSync]);
      store = mockStore(initState);
      done();
    });
  });
  afterEach(() => {
    store.clearActions();
    mockConnector.broadcast.mockClear();
  });
  test("Received events get piped in", () => {
    expect(store.getActions()[0]).toMatchObject(action);
  });
  test("On client connect broadcast state", () => {
    expect(mockConnector.broadcast.mock.calls[0][1]).toEqual(initState);
  });
  test("Local actions get passed through", () => {
    const testAction = {
      type: "swag"
    };
    store.dispatch(testAction);
    expect(store.getActions()[1]).toMatchObject(testAction);
  });
  test("Local actions get broadcast", () => {
    const testAction = {
      type: "swag"
    };
    store.dispatch(testAction);
    expect(mockConnector.broadcast.mock.calls[1][1]).toMatchObject(testAction);
  });
  test("Remote actions don't passed through", () => {
    const testAction = {
      type: "swag",
      __$syncAction: true
    };
    store.dispatch(testAction);
    expect(store.getActions().length).toBe(1);
  });
});
