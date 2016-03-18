import {
  debounce,
  throttle
} from 'lodash'
import $ from 'jquery'
import Peer from 'peerjs'
import Emitter from 'tiny-emitter'


const cursorTemplate = (id) => `
<div id="${id}">
  <svg width="18px" height="26px" viewBox="0 0 18 26" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <!-- Generator: Sketch 3.6.1 (26313) - http://www.bohemiancoding.com/sketch -->
      <title>Default</title>
      <desc>Created with Sketch.</desc>
      <defs>
          <filter x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox" id="filter-1">
              <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
              <feGaussianBlur stdDeviation="2" in="shadowOffsetOuter1" result="shadowBlurOuter1"></feGaussianBlur>
              <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.35 0" in="shadowBlurOuter1" type="matrix" result="shadowMatrixOuter1"></feColorMatrix>
              <feMerge>
                  <feMergeNode in="shadowMatrixOuter1"></feMergeNode>
                  <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
          </filter>
          <path id="path-2" d="M5,5 L5,17 L8,14 L10.5,19 L11.5,19 C11.5,19 12.1456602,18.3495845 12,18 C11.3123269,16.3495845 9.5,13 9.5,13 L13,13 L5,5 Z"></path>
      </defs>
      <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" filter="url(#filter-1)">
          <g id="Default">
              <use id="pointerFill" stroke="#FFFFFF" stroke-width="2" fill="#000000" fill-rule="evenodd" xlink:href="#path-2"></use>
              <use id="pointerStroke" stroke="#000000" stroke-width=".5" fill="#000000" fill-rule="evenodd" xlink:href="#path-2"></use>
          </g>
      </g>
  </svg>
  <div style="display:inline-block;background:rgba(0,0,0,.7);color:white;margin-left:5px;font-family:Arial;font-size:10px;padding:3px 6px;border-radius:1000px;">
    ${id}
  </div>
</div>`

const cursor = (id) => {
  const cursorEl = document.getElementById(id)

  if (cursorEl) {
    return $(cursorEl)
  }

  return $(cursorTemplate(id)).css({
    position: 'absolute',
    left: -20,
    top: -20,
    pointerEvents: 'none',
    opacity: 0,
    transition: 'all .1s linear'
  }).appendTo('body')
}

export default (apiKey, remoteId) => {
  const emitter = new Emitter()
  let connections = []
  const peer = new Peer(Math.floor(Math.random() * 1000000000).toString(), {
    key: apiKey
  })

  console.log(`${window.location.origin}${window.location.pathname || ''}?session_id=${peer.id}`)

  const newConnection = (connection) => {

    if (connection.open) emitter.emit('connected', {})

    connection.on('open', () => emitter.emit('connected', {}))

    connection.on('data', (data) => {
      emitter.emit(data.type, data.payload, data.id)
    })

    connection.on('close', () => {
      const connectionIndex = connections.indexOf(connection)
      connections.splice(connectionIndex, 1)
      cursor(connection.peer).remove()
    })

    connections.push(connection)
  }

  if (remoteId) {
    newConnection(peer.connect(remoteId))
  }

  peer.on('connection', newConnection)

  const broadcast = (event, payload) => {
    connections.forEach((connection) => {
      connection.send({
        type: event,
        payload: payload,
        id: peer.id
      })
    })
  };

  const fadeMouse = debounce((id) => {
    cursor(id).css('opacity', 0)
  }, 1000)

  const fadeInMouse = (position, id) => {
    const currentCursor = cursor(id)
    if (position) {
      currentCursor.css({
        left: position.x,
        top: position.y - 5
      })
    }
    currentCursor.css({
      opacity: 0.4
    })
    fadeMouse(id)
  }

  emitter.on('cursor', fadeInMouse);
  emitter.on('click', fadeInMouse);

  const sendMouseMovement = throttle((e) => {
    broadcast('cursor', {
      x: e.pageX,
      y: e.pageY
    })
  }, 100)

  $(window).on('click', () => broadcast('click', {}))
    .on('mousemove', (e) => sendMouseMovement(e))

  const stateSynchronizer = (store) => {

    emitter.on('connected', () => broadcast('current_state', store.getState()))

    emitter.on('action', (action) => {
      if (remoteId) action.__$syncAction = true
      store.dispatch(action)
    })

    return (next) => (action) => {

      if (remoteId && action.__$syncAction !== true) {
        broadcast('action', action)
        return void 0
      }

      if (!remoteId && action.__$syncAction !== true) {
        broadcast('action', action)
      }

      let returnValue = next(action)

      return returnValue
    }
  }

  if (remoteId) {
    return new Promise(function (resolve, reject) {
      emitter.once('current_state', (state) => {
        if(typeof state === undefined) return reject()
        resolve({
          state,
          stateSynchronizer
        })

      })
      if (false) reject()
    })
  } else {
    return stateSynchronizer
  }
}
