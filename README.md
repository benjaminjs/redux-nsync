# redux-nsync
Screenhero styled sharing for Redux apps using WebRTC 

![Turn todo list to chat app](http://i.giphy.com/3o6EhNIo6hsXvJ8DoA.gif)
## TODO
- Tests
- Examples
- Break-out sync state from view sync to support both Web and Mobile
- Break-out Peerjs to Sync Connector APIs so it can be interchangable.

## Example

```javascript
// Other imports
import Sync from './middleware/sync'

const load = (store) => {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )
}

const getParameterByName = (name, url) => {
    if (!url) url = window.location.href;
    url = url.toLowerCase();
    name = name.replace(/[\[\]]/g, "\\$&").toLowerCase();
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const remoteSessionId = getParameterByName('session_id')
const connectedSync = Sync('<INSERT_PERSONAL_PEERJS_KEY>', remoteSessionId);
let store;

if(remoteSessionId) {
  connectedSync.then(function({ state, stateSynchronizer }){
    store = createStore(
      todoApp,
      state,
      applyMiddleware(stateSynchronizer)
    )

    load(store)
  }, function(err){
    console.log(err);
  })
}
else {
  store = createStore(
    todoApp,
    applyMiddleware(connectedSync)
  )

  load(store)
}
```
