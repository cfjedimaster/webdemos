(function() {
  var create, defaults, titlegen,
    __hasProp = {}.hasOwnProperty,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  defaults = {
    min_word_count: 2,
    max_word_count: 16,
    max_attempts: 20,
    splitter: /(\s|'s|[:!?]\s)/,
    joiner: ' ',
    transform: function(title) {
      return title.replace(/\s('s|[:!?])/g, '$1');
    }
  };

  create = function(config) {
    var feed, generate, k, states, titles, v, _next;
    if (config == null) {
      config = {};
    }
    for (k in defaults) {
      if (!__hasProp.call(defaults, k)) continue;
      v = defaults[k];
      if (config[k] == null) {
        config[k] = defaults[k];
      }
    }
    titles = [];
    states = {};
    feed = function(_titles) {
      var first, i, next, state, title, word, words, _base, _base1, _i, _j, _len, _len1, _ref;
      states = {
        __BEGIN__: {
          t: 1,
          p: {
            '__END__': 1
          }
        },
        __END__: {
          t: 0,
          p: {}
        }
      };
      titles = _titles;
      for (i = _i = 0, _len = titles.length; _i < _len; i = ++_i) {
        title = titles[i];
        title = titles[i] = title.trim();
        if (title.length === 0) {
          continue;
        }
        words = (function() {
          var _j, _len1, _ref, _results;
          _ref = title.split(config.splitter);
          _results = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            word = _ref[_j];
            if (word.trim().length > 0) {
              _results.push(word.trim());
            }
          }
          return _results;
        })();
        first = true;
        for (i = _j = 0, _len1 = words.length; _j < _len1; i = ++_j) {
          word = words[i];
          if (first) {
            ++states.__BEGIN__.t;
            if ((_base = states.__BEGIN__.p)[word] == null) {
              _base[word] = 0;
            }
            ++states.__BEGIN__.p[word];
            first = false;
          }
          next = (_ref = words[i + 1]) != null ? _ref : '__END__';
          if (!states.hasOwnProperty(word)) {
            states[word] = {
              p: {}
            };
          }
          state = states[word];
          if (state.t == null) {
            state.t = 0;
          }
          ++state.t;
          if ((_base1 = state.p)[next] == null) {
            _base1[next] = 0;
          }
          ++state.p[next];
        }
      }
    };
    _next = function(depth) {
      var count, n, next, rnd, state, title, tot, _ref;
      if (depth == null) {
        depth = 0;
      }
      title = '';
      state = states.__BEGIN__;
      n = 0;
      while (n < config.max_word_count) {
        rnd = Math.round(Math.random() * state.t);
        tot = 0;
        _ref = state.p;
        for (next in _ref) {
          if (!__hasProp.call(_ref, next)) continue;
          count = _ref[next];
          tot += count;
          if (tot >= rnd) {
            break;
          }
        }
        if (next === '__END__') {
          break;
        }
        state = states[next];
        if (n !== 0) {
          next = config.joiner + next;
        }
        title += next;
        ++n;
      }
      title = config.transform(title);
      if (depth < config.max_attempts && (n < config.min_word_count || __indexOf.call(titles, title) >= 0)) {
        return _next(depth + 1);
      }
      return title;
    };
    generate = {
      feed: feed,
      config: config,
      next: _next
    };
    generate.feed([]);
    return generate;
  };

  titlegen = {
    create: create
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = titlegen;
  }

  if (typeof window !== "undefined" && window !== null) {
    window.titlegen = titlegen;
  }

  if (typeof global !== "undefined" && global !== null) {
    global.titlegen = titlegen;
  }

}).call(this);
