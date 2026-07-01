(function () {
  var _fbToken = '';
  var _tokenExpiry = 0;
  var _fetching = null;
  var _pendingFirestore = [];

  var FIREBASE_API_KEY = 'AIzaSyAxc-i2-VmE14fhFCdf-vGi2GaRzg1VqoQ';

  function _setToken(tok, expiresInSeconds) {
    if (!tok) return;
    _fbToken = tok;
    _tokenExpiry = Date.now() + (expiresInSeconds ? expiresInSeconds * 1000 : 55 * 60 * 1000);
    if (typeof window._provideToken === 'function') window._provideToken(_fbToken);
    var q = _pendingFirestore.splice(0);
    q.forEach(function (fn) { fn(_fbToken); });
  }

  function _fetchDirect() {
    return fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true }),
        referrerPolicy: 'unsafe-url'
      }
    )
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return (d && d.idToken) ? d : null; })
      .catch(function () { return null; });
  }

  function _fetchViaProxy() {
    return fetch('/api/firebase-anon', { method: 'POST' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return (d && d.idToken) ? d : null; })
      .catch(function () { return null; });
  }

  function _fetchToken() {
    if (_fetching) return _fetching;
    _fetching = _fetchViaProxy()
      .then(function (d) { return d || _fetchDirect(); })
      .then(function (d) {
        if (d && d.idToken) _setToken(d.idToken, d.expiresIn ? Number(d.expiresIn) : undefined);
        _fetching = null;
        return _fbToken;
      })
      .catch(function () { _fetching = null; return ''; });
    return _fetching;
  }

  window._getFirebaseAnonToken = function () {
    if (_fbToken && Date.now() < _tokenExpiry) return Promise.resolve(_fbToken);
    return _fetchToken();
  };

  var _origFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input
            : (input && input.url) ? input.url : '';

    if (url && url.includes('identitytoolkit.googleapis.com')) {
      return _origFetch(input, init).then(function (response) {
        var clone = response.clone();
        clone.json().then(function (data) {
          if (data && data.idToken) {
            _setToken(data.idToken, data.expiresIn ? Number(data.expiresIn) : undefined);
          }
        }).catch(function () {});
        return response;
      });
    }

    if (url && url.includes('firestore.googleapis.com')) {
      var headers = init && init.headers;
      var existingAuth = null;
      if (headers instanceof Headers) {
        existingAuth = headers.get('Authorization');
      } else if (headers && typeof headers === 'object') {
        existingAuth = headers['Authorization'] || headers['authorization'];
      }

      if (existingAuth) return _origFetch(input, init);

      if (_fbToken && Date.now() < _tokenExpiry) {
        init = Object.assign({}, init || {});
        var nh = new Headers(init.headers || {});
        nh.set('Authorization', 'Bearer ' + _fbToken);
        init.headers = nh;
        return _origFetch(input, init);
      }

      return new Promise(function (resolve) {
        var capturedInit = init;
        window._getFirebaseAnonToken().then(function (tok) {
          if (tok) {
            capturedInit = Object.assign({}, capturedInit || {});
            var nh2 = new Headers(capturedInit.headers || {});
            nh2.set('Authorization', 'Bearer ' + tok);
            capturedInit.headers = nh2;
          }
          resolve(_origFetch(input, capturedInit));
        });
      });
    }

    return _origFetch(input, init);
  };

  _fetchToken();
})();
